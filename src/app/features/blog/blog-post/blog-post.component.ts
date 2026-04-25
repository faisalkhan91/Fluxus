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
import { BlogPost } from '../../../shared/models/blog-post.model';
import { environment } from '../../../../environments/environment';

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

  readonly scrollProgress = signal(0);

  constructor() {
    // Update <title> + meta tags as the post resolves.
    effect(() => {
      const post = this.meta();
      if (post) untracked(() => this.updateMetaTags(post));
    });

    afterNextRender(() => {
      const postLayout = this.elRef.nativeElement.querySelector(
        '.post-layout',
      ) as HTMLElement | null;
      if (!postLayout) return;

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
    });
  }

  private updateMetaTags(post: BlogPost): void {
    const url = `${environment.siteUrl}/blog/${post.slug}`;
    const title = `${post.title} - ${environment.siteName}`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: post.excerpt });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: post.excerpt });
    this.metaService.updateTag({ name: 'description', content: post.excerpt });
  }
}
