import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  untracked,
  DestroyRef,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { httpResource } from '@angular/common/http';
import { GlassPanelComponent } from '../../../ui/glass-panel/glass-panel.component';
import { IconComponent } from '../../../ui/icon/icon.component';
import { TrustedHtmlPipe } from '../../../shared/pipes/trusted-html.pipe';
import { BlogService } from '../../../core/services/blog.service';
import { MarkdownService } from '../../../core/services/markdown.service';
import { ProfileDataService } from '../../../core/services/profile-data.service';
import { BlogPost } from '../../../shared/models/blog-post.model';
import { environment } from '../../../../environments/environment';
import { slugify } from '../../../shared/utils/string.utils';
import { computeReadingTime, formatPostDate } from '../../../shared/utils/blog.utils';

@Component({
  selector: 'app-blog-post',
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.css',
  imports: [GlassPanelComponent, IconComponent, RouterLink, TrustedHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent {
  private route = inject(ActivatedRoute);
  private blog = inject(BlogService);
  // MarkdownService is injected here (not in BlogService) so the heavy
  // marked + highlight.js graph only ships with this lazy route chunk.
  private md = inject(MarkdownService);
  protected profile = inject(ProfileDataService);
  private destroyRef = inject(DestroyRef);
  private elRef = inject(ElementRef);
  private metaService = inject(Meta);
  private titleService = inject(Title);

  protected slug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')),
    { initialValue: '' },
  );

  // Reactive markdown body. Re-fires automatically when slug() changes and
  // resets to the empty default while loading — fixing the stale-content
  // flash that the previous subscribe-based pipeline had.
  private postBody = httpResource.text(
    () => {
      const slug = this.slug();
      return slug ? `assets/blog/posts/${slug}.md` : undefined;
    },
    { defaultValue: '' },
  );

  readonly meta = computed<BlogPost | undefined>(() => {
    const slug = this.slug();
    return this.blog.posts().find((p) => p.slug === slug);
  });

  readonly content = computed(() => {
    const raw = this.postBody.value();
    return raw ? this.md.render(raw) : '';
  });

  readonly loading = computed(() => this.postBody.isLoading());

  readonly error = computed<string | null>(() => {
    if (this.postBody.error()) return 'Failed to load blog post';
    // Wait until the posts manifest has loaded before deciding "not found".
    if (this.blog.loading() || this.postBody.isLoading()) return null;
    if (this.slug() && this.blog.posts().length > 0 && !this.meta()) {
      return 'Post not found';
    }
    return null;
  });

  readonly adjacentPosts = computed(() => {
    const post = this.meta();
    return post ? this.blog.getAdjacentPosts(post.slug) : { prev: undefined, next: undefined };
  });

  readonly hasAdjacent = computed(() => {
    const adj = this.adjacentPosts();
    return !!(adj.prev || adj.next);
  });

  /** Auto-derived reading time (when body is loaded), falling back to manifest. */
  readonly readingTime = computed(() => {
    const raw = this.postBody.value();
    if (raw) return computeReadingTime(raw);
    return this.meta()?.readingTime ?? '';
  });

  /** Locale-aware date label, e.g. "April 12, 2026". */
  readonly formattedDate = computed(() => {
    const date = this.meta()?.date;
    return date ? formatPostDate(date) : '';
  });

  /**
   * Pre-built share URLs for the post. Plain `<a href>` links to each
   * service's web intent — keeps third-party JS off the page entirely.
   */
  readonly shareUrls = computed(() => {
    const post = this.meta();
    const slug = this.slug();
    const url = encodeURIComponent(`${environment.siteUrl}/blog/${slug}`);
    const title = encodeURIComponent(post?.title ?? '');
    const summary = encodeURIComponent(post?.excerpt ?? '');
    return {
      twitter: `https://x.com/intent/tweet?text=${title}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      hackerNews: `https://news.ycombinator.com/submitlink?u=${url}&t=${title}`,
      email: `mailto:?subject=${title}&body=${summary}%0A%0A${url}`,
    };
  });

  readonly linkCopied = signal(false);

  protected async copyShareLink(): Promise<void> {
    const slug = this.slug();
    if (!slug) return;
    const url = `${environment.siteUrl}/blog/${slug}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        this.linkCopied.set(true);
        setTimeout(() => this.linkCopied.set(false), 1500);
      }
    } catch {
      // best-effort
    }
  }

  protected tagSlug(tag: string): string {
    return slugify(tag);
  }

  readonly scrollProgress = signal(0);

  constructor() {
    // Update <title> + meta tags as the post resolves.
    effect(() => {
      const post = this.meta();
      if (post) untracked(() => this.updateMetaTags(post));
    });

    afterNextRender(() => {
      const root = this.elRef.nativeElement as HTMLElement;
      const postLayout = root.querySelector('.post-layout') as HTMLElement | null;
      if (!postLayout) return;

      // Skip the JS scroll listener entirely on browsers that support
      // CSS scroll-driven animations — the `.reading-progress` bar is then
      // animated via `animation-timeline: scroll(root)` on the compositor
      // (see styles.css), which is cheaper and always smooth.
      const cssScrollDriven =
        typeof CSS !== 'undefined' &&
        typeof CSS.supports === 'function' &&
        CSS.supports('animation-timeline: scroll()');

      if (!cssScrollDriven) {
        const onScroll = () => {
          const rect = postLayout.getBoundingClientRect();
          const total = postLayout.offsetHeight - window.innerHeight;
          if (total <= 0) {
            this.scrollProgress.set(100);
            return;
          }
          const scrolled = Math.max(0, -rect.top);
          this.scrollProgress.set(Math.min(100, (scrolled / total) * 100));
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
      }

      // One delegated click listener for every code-block "Copy" button. The
      // markup is generated by MarkdownService — see the `code` renderer.
      const onClick = async (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        const button = target?.closest('.copy-btn') as HTMLButtonElement | null;
        if (!button) return;
        const code = button.parentElement?.querySelector('code')?.textContent ?? '';
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(code);
          }
          const original = button.textContent;
          button.textContent = 'Copied!';
          button.classList.add('copy-btn--copied');
          setTimeout(() => {
            button.textContent = original;
            button.classList.remove('copy-btn--copied');
          }, 1500);
        } catch {
          // Best-effort; older browsers / blocked clipboard just no-op.
        }
      };
      postLayout.addEventListener('click', onClick);
      this.destroyRef.onDestroy(() => postLayout.removeEventListener('click', onClick));
    });
  }

  private updateMetaTags(post: BlogPost): void {
    const url = `${environment.siteUrl}/blog/${post.slug}`;
    const title = `${post.title} - ${environment.siteName}`;
    const cover = post.cover
      ? post.cover.startsWith('http')
        ? post.cover
        : `${environment.siteUrl}${post.cover.startsWith('/') ? '' : '/'}${post.cover}`
      : `${environment.siteUrl}/og/${post.slug}.png`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: post.excerpt });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:image', content: cover });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: post.excerpt });
    this.metaService.updateTag({ name: 'twitter:image', content: cover });
    this.metaService.updateTag({ name: 'description', content: post.excerpt });
  }
}
