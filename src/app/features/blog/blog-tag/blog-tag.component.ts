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
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { BlogService } from '@core/services/blog.service';
import { SeoService } from '@core/services/seo.service';
import { slugify } from '@shared/utils/string.utils';
import { formatPostDate } from '@shared/utils/blog.utils';
import { environment } from '@env/environment';

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
  private seo = inject(SeoService);

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
      untracked(() => this.updateMetaTags({ slug, label }));
    });
  }

  /**
   * Named-args shape — see the same method in projects-tag.component.ts
   * for the rationale (prevents a silent slug/label swap at the call
   * site since both are plain strings).
   */
  private updateMetaTags({ slug, label }: { slug: string; label: string }): void {
    const url = `${environment.siteUrl}/blog/tag/${slug}`;
    const title = `Posts tagged "${label}" - ${environment.siteName}`;
    const description = `Every post on Faisal Khan's blog tagged with "${label}".`;

    this.seo.updateDynamicMeta({ title, description, url, type: 'website' });
    this.seo.setCanonical(url);
  }

  protected formatDate(iso: string): string {
    return formatPostDate(iso);
  }
}
