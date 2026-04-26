import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { BlogService } from '@core/services/blog.service';
import { slugify } from '@shared/utils/string.utils';
import { formatPostDate } from '@shared/utils/blog.utils';
import { environment } from '@env/environment';

const DEFAULT_OG_IMAGE = `${environment.siteUrl}/assets/images/og-image.png`;

@Component({
  selector: 'app-blog-tag',
  templateUrl: './blog-tag.component.html',
  styleUrl: './blog-tag.component.css',
  imports: [GlassCardComponent, IconComponent, SectionHeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogTagComponent {
  private route = inject(ActivatedRoute);
  protected blog = inject(BlogService);
  // Route data sets `seo: { dynamicMeta: true }` so SeoService skips this
  // route and we own the head tags ourselves (mirrors BlogPostComponent).
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);

  protected tagSlug = toSignal(
    this.route.paramMap.pipe(map((p) => (p.get('tag') ?? '').toLowerCase())),
    { initialValue: '' },
  );

  /**
   * The displayable tag name = whatever capitalisation the first matching post
   * uses, falling back to the slug. We compare on slugified tags so URLs like
   * `/blog/tag/ci-cd` match either `CI/CD` or `ci/cd` in the manifest.
   */
  readonly tagLabel = computed(() => {
    const slug = this.tagSlug();
    if (!slug) return '';
    for (const post of this.blog.posts()) {
      const match = post.tags.find((t) => slugify(t) === slug);
      if (match) return match;
    }
    return slug;
  });

  readonly matchingPosts = computed(() => {
    const slug = this.tagSlug();
    if (!slug) return [];
    return this.blog.posts().filter((p) => p.tags.some((t) => slugify(t) === slug));
  });

  constructor() {
    // Update <title>, OG/Twitter, description, and canonical whenever the
    // resolved tag label changes. The build-time inject-meta.mjs writes the
    // same shape into prerendered HTML; this keeps SPA navigation in sync.
    effect(() => {
      const slug = this.tagSlug();
      const label = this.tagLabel();
      if (!slug || !label) return;
      untracked(() => this.updateMetaTags(slug, label));
    });
  }

  private updateMetaTags(slug: string, label: string): void {
    const url = `${environment.siteUrl}/blog/tag/${slug}`;
    const title = `Posts tagged "${label}" - ${environment.siteName}`;
    const description = `Every post on Faisal Khan's blog tagged with "${label}".`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:image', content: DEFAULT_OG_IMAGE });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: DEFAULT_OG_IMAGE });
    this.setCanonical(url);
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  protected formatDate(iso: string): string {
    return formatPostDate(iso);
  }
}
