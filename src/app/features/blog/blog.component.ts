import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
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

interface DecoratedPost {
  post: BlogPost;
  cover: string;
  coverDims: { w: number; h: number };
}

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
  imports: [
    GlassCardComponent,
    IconComponent,
    SectionHeaderComponent,
    NgOptimizedImage,
    RouterLink,
  ],
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
   * Memoised list of `{ post, cover, coverDims }` triples used by the
   * template. Wrapping the cover-resolution logic in a `computed()` means
   * each post's cover URL + dims are recomputed only when `blog.posts()`
   * changes (new draft published, manifest reload, etc.) instead of being
   * recreated as fresh object literals on every CD pass — earlier
   * `featuredCoverDims(post)` returned a brand-new `{ w, h }` per call,
   * which defeats reference-equality `OnPush` checks if any descendant
   * component ever takes the result as an `@Input()`.
   *
   * Cover resolution: author-supplied `cover` wins; otherwise we fall back
   * to the build-time `/og/<slug>.png` that `scripts/build-og-cards.mjs`
   * always emits — so the hero card always has imagery in production. The
   * fallback only 404s in `ng serve` when the post hasn't set a `cover`,
   * which is acceptable for the dev experience.
   */
  protected decoratedPosts = computed<DecoratedPost[]>(() =>
    this.blog.posts().map((post) => ({
      post,
      cover: post.cover ?? `/og/${post.slug}.png`,
      coverDims: resolveCoverDims(post.cover),
    })),
  );

  /**
   * Four-state discriminant for the blog index. The template renders one
   * branch via `@switch (viewState())` instead of a chain of `@if` /
   * `@else if`. The order of checks matters: `'ready'` wins as soon as any
   * post is available so a partial manifest reload (rare) keeps showing
   * the previous list rather than briefly snapping to a "Loading…" or
   * empty state. After that, the live `blog.loading()` / `blog.error()`
   * signals decide between the loading / error / empty surfaces.
   */
  protected viewState = computed<'ready' | 'loading' | 'error' | 'empty'>(() => {
    if (this.decoratedPosts().length) return 'ready';
    if (this.blog.loading()) return 'loading';
    if (this.blog.error()) return 'error';
    return 'empty';
  });

  protected tagSlug(tag: string): string {
    return slugify(tag);
  }

  protected formatDate(iso: string): string {
    return formatPostDate(iso);
  }
}

function resolveCoverDims(cover: string | undefined): { w: number; h: number } {
  if (!cover || /^https?:/i.test(cover)) return OG_FALLBACK_DIMS;
  const key = cover.replace(/^\.?\/?/, '');
  return IMAGE_DIMS[key] ?? OG_FALLBACK_DIMS;
}
