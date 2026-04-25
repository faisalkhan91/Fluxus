import { Injectable, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { BlogPost } from '@shared/models/blog-post.model';

@Injectable({ providedIn: 'root' })
export class BlogService {
  // Reactive resource: kicks off eagerly, exposes value/isLoading/error as
  // signals, and stays in sync with HttpClient (interceptors, transfer cache).
  // Note: per-post markdown is fetched directly inside BlogPostComponent so
  // that the heavy `marked` + `highlight.js` graph stays out of any chunk
  // that imports BlogService (e.g. the home route via HeroComponent).
  private postsResource = httpResource<BlogPost[]>(() => 'assets/blog/posts.json', {
    defaultValue: [],
  });

  /**
   * Public surfaces (blog list, hero "latest", tag archive, post page) only
   * see non-draft posts. Drafts are still prerendered at their /blog/<slug>
   * URL so the author can review them, but they're omitted everywhere a
   * casual visitor might bump into them — matching the way build-feed.mjs
   * and build-sitemap.mjs already filter them.
   */
  readonly posts = computed(() =>
    this.postsResource.hasValue()
      ? this.sortByDateDesc(this.postsResource.value() ?? []).filter((p) => !p.draft)
      : [],
  );

  /** Includes drafts. Useful for future blog-post-by-slug lookup paths. */
  readonly allPosts = computed(() =>
    this.postsResource.hasValue() ? this.sortByDateDesc(this.postsResource.value() ?? []) : [],
  );

  readonly latestPosts = computed(() => this.posts().slice(0, 2));
  readonly loading = computed(() => this.postsResource.isLoading());
  readonly error = computed(() => (this.postsResource.error() ? 'Failed to load blog posts' : null));

  /**
   * Walks the public (non-draft) posts list so adjacent navigation stays in
   * the published feed. Drafts can still be opened directly via their URL but
   * never participate in prev/next chains.
   */
  getAdjacentPosts(slug: string): { prev?: BlogPost; next?: BlogPost } {
    const all = this.posts();
    const idx = all.findIndex((p) => p.slug === slug);
    if (idx === -1) return {};
    return {
      prev: idx > 0 ? all[idx - 1] : undefined,
      next: idx < all.length - 1 ? all[idx + 1] : undefined,
    };
  }

  /**
   * Returns the full ordered series for a post (including the post itself),
   * sorted by `seriesOrder`. Returns `undefined` when the post has no series.
   * Drafts within the series are excluded so part numbers stay accurate for
   * what the public actually sees.
   */
  getSeries(slug: string): { series: string; index: number; posts: BlogPost[] } | undefined {
    const all = this.posts();
    const current = all.find((p) => p.slug === slug);
    if (!current?.series) return undefined;
    const posts = all
      .filter((p) => p.series === current.series)
      .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
    const index = posts.findIndex((p) => p.slug === slug);
    return { series: current.series, index, posts };
  }

  /**
   * Returns up to `limit` other posts that share the most tags with `slug`,
   * sorted by overlap count (descending) then by date (newest first). Drafts
   * and the post itself are excluded.
   */
  getRelatedPosts(slug: string, limit = 3): BlogPost[] {
    const all = this.posts();
    const current = all.find((p) => p.slug === slug);
    if (!current) return [];
    const currentTags = new Set(current.tags ?? []);
    const scored = all
      .filter((p) => p.slug !== slug)
      .map((p) => ({
        post: p,
        overlap: (p.tags ?? []).filter((t) => currentTags.has(t)).length,
      }))
      .filter(({ overlap }) => overlap > 0);
    scored.sort((a, b) => b.overlap - a.overlap || b.post.date.localeCompare(a.post.date));
    return scored.slice(0, limit).map(({ post }) => post);
  }

  private sortByDateDesc(posts: BlogPost[]): BlogPost[] {
    return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
