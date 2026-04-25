import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { BlogService } from '@core/services/blog.service';
import { IMAGE_DIMS } from '@core/services/image-dims.generated';
import { BlogPost } from '@shared/models/blog-post.model';
import { slugify } from '@shared/utils/string.utils';
import { formatPostDate } from '@shared/utils/blog.utils';

/** Fallback cover dimensions match the build-og-cards.mjs output (1200x630). */
const OG_FALLBACK_DIMS = { w: 1200, h: 630 } as const;

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
  imports: [GlassCardComponent, IconComponent, SectionHeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent {
  protected blog = inject(BlogService);

  /** De-duplicated, alphabetised list of every tag across all posts. */
  protected allTags = computed(() => {
    const set = new Set<string>();
    for (const post of this.blog.posts()) {
      for (const tag of post.tags) set.add(tag);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  /**
   * Cover URL to render at the top of the featured (newest) post card.
   * Author-supplied `cover` wins; otherwise we fall back to the build-time
   * `/og/<slug>.png` that `scripts/build-og-cards.mjs` always emits — so the
   * hero card always has imagery in production. The fallback only 404s in
   * `ng serve` when the post hasn't set a `cover`, which is acceptable for
   * the dev experience.
   */
  protected featuredCover(post: BlogPost): string {
    return post.cover ?? `/og/${post.slug}.png`;
  }

  protected featuredCoverDims(post: BlogPost): { w: number; h: number } {
    const cover = post.cover;
    if (!cover || /^https?:/i.test(cover)) return OG_FALLBACK_DIMS;
    const key = cover.replace(/^\.?\/?/, '');
    return IMAGE_DIMS[key] ?? OG_FALLBACK_DIMS;
  }

  protected tagSlug(tag: string): string {
    return slugify(tag);
  }

  protected formatDate(iso: string): string {
    return formatPostDate(iso);
  }
}
