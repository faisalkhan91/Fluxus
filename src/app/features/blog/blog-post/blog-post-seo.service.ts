import { Injectable, inject } from '@angular/core';
import { SeoService } from '@core/services/seo.service';
import type { BlogPost } from '@shared/models/blog-post.model';
import { environment } from '@env/environment';

/**
 * Blog-post-specific SEO concerns extracted from `BlogPostComponent`.
 *
 * Owns the two head-level side-effects that are unique to a single
 * blog post:
 *  - Dynamic meta tags (`<title>`, OpenGraph, Twitter, description)
 *    derived from the post's title / excerpt / cover.
 *  - `<link rel="prev|next">` for posts that belong to a series, so
 *    search engines and reading-mode UIs can stitch the parts into
 *    one logical document.
 *
 * Sits at the feature layer (not in `core/services`) so the generic
 * `SeoService` stays domain-neutral — this service is the place that
 * knows about `BlogPost` and series shape. `SeoService` provides the
 * primitive `setLinkRel` / `setCanonical` writes underneath.
 */
@Injectable({ providedIn: 'root' })
export class BlogPostSeoService {
  private seo = inject(SeoService);

  /**
   * Update `<title>` + the dynamic-meta tag set for a single post.
   * Builds the OG cover URL deterministically: external (`http…`) covers
   * pass through, repo-relative covers get the site origin prefixed,
   * and posts with no cover fall back to the prerendered `/og/<slug>.png`
   * card baked at build time.
   */
  updateMetaTags(post: BlogPost): void {
    const url = `${environment.siteUrl}/blog/${post.slug}`;
    const title = `${post.title} - ${environment.siteName}`;
    const cover = post.cover
      ? post.cover.startsWith('http')
        ? post.cover
        : `${environment.siteUrl}${post.cover.startsWith('/') ? '' : '/'}${post.cover}`
      : `${environment.siteUrl}/og/${post.slug}.png`;

    this.seo.updateDynamicMeta({
      title,
      description: post.excerpt,
      url,
      type: 'article',
      image: cover,
    });
  }

  /**
   * Mirror the post's series neighbours onto `<link rel="prev|next">` in
   * the document head. Clears both when the post is a one-off (no series
   * or only one entry). Effects always overwrite, so calling this on
   * slug navigation is idempotent.
   */
  updateSeriesLinkRels(
    slug: string,
    series: { posts: BlogPost[]; index: number } | undefined,
  ): void {
    if (!slug || !series || series.posts.length < 2) {
      this.clearSeriesLinkRels();
      return;
    }
    const prev = series.posts[series.index - 1];
    const next = series.posts[series.index + 1];
    this.seo.setLinkRel('prev', prev ? `${environment.siteUrl}/blog/${prev.slug}` : null);
    this.seo.setLinkRel('next', next ? `${environment.siteUrl}/blog/${next.slug}` : null);
  }

  /**
   * Tear-down hook — call from the component's `destroyRef.onDestroy`
   * so prev/next links from the previous post don't leak onto the next
   * route the user navigates to.
   */
  clearSeriesLinkRels(): void {
    this.seo.removeLinkRel('prev');
    this.seo.removeLinkRel('next');
  }
}
