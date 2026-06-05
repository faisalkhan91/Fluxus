import { Component, inject, computed, effect, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { IconComponent } from '@ui/icon/icon.component';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { PostCardComponent } from '../post-card/post-card.component';
import { BlogService } from '@core/services/blog.service';
import { SeoService } from '@core/services/seo.service';
import { resolveTagLabel, filterByTagSlug } from '@shared/utils/tag.utils';
import { environment } from '@env/environment';
import { blogTagUrl } from '@shared/utils/url.utils';

@Component({
  selector: 'app-blog-tag',
  templateUrl: './blog-tag.component.html',
  styleUrls: ['../../../shared/styles/tag-archive.css', './blog-tag.component.css'],
  imports: [IconComponent, SectionHeaderComponent, RouterLink, PostCardComponent],
})
export class BlogTagComponent {
  private route = inject(ActivatedRoute);
  protected blog = inject(BlogService);
  // Route data sets `seo: { dynamicMeta: true }` so SeoService skips this
  // route and we own the head tags ourselves (mirrors BlogPostComponent).
  private seo = inject(SeoService);

  protected readonly tagSlug = toSignal(
    this.route.paramMap.pipe(map((p) => (p.get('tag') ?? '').toLowerCase())),
    { initialValue: '' },
  );

  /**
   * The displayable tag name = whatever capitalisation the first matching post
   * uses, falling back to the slug. We compare on slugified tags so URLs like
   * `/blog/tag/ci-cd` match either `CI/CD` or `ci/cd` in the manifest.
   */
  readonly tagLabel = computed(() =>
    resolveTagLabel(this.blog.posts(), (p) => p.tags, this.tagSlug()),
  );

  readonly matchingPosts = computed(() =>
    filterByTagSlug(this.blog.posts(), (p) => p.tags, this.tagSlug()),
  );

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
    const url = blogTagUrl(slug);
    const title = `Posts tagged "${label}" - ${environment.siteName}`;
    const description = `Every post on Faisal Khan's blog tagged with "${label}".`;

    this.seo.updateDynamicMeta({ title, description, url, type: 'website' });
    this.seo.setCanonical(url);
  }
}
