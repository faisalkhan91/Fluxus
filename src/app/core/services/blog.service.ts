import { Injectable, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { BlogPost } from '@shared/models/blog-post.model';

/**
 * `YYYY-MM-DD` for "today" in UTC. The `posts.json` `date` field is also a
 * `YYYY-MM-DD` literal, so a lex comparison answers "has this post's calendar
 * day arrived yet?" without having to reason about timezones (matches the
 * technique already used in scripts/build-feed.mjs and scripts/build-sitemap.mjs).
 *
 * Re-evaluated on every `computed()` recomputation, which is whenever the
 * upstream `httpResource` value changes — fine for SSR (build-time date) and
 * fine for the live SPA, where the gate flips the moment a fresh evaluation
 * runs after midnight UTC. There is intentionally no live ticker; a visitor
 * who has the tab open across the publish boundary picks up the post on the
 * next route navigation, AppUpdateService reload, or visibility change.
 */
function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Single source of truth for "should this post show on public surfaces?".
 * A post is public when it is not flagged as draft AND its publish date has
 * already arrived (calendar-day comparison). Used by `posts` directly and by
 * every consumer that flows through it — blog index, hero latest posts, tag
 * archive, command palette, related/adjacent/series helpers.
 */
function isPublished(post: BlogPost, today: string): boolean {
  if (post.draft) return false;
  return post.date <= today;
}

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
   * see published posts — non-draft AND with a publish date of today or
   * earlier. Drafts and future-dated (scheduled) posts are still prerendered
   * at their /blog/<slug> URL so the author can review them, but they're
   * omitted everywhere a casual visitor might bump into them — matching the
   * way build-feed.mjs and build-sitemap.mjs already filter.
   */
  readonly posts = computed(() => {
    if (!this.postsResource.hasValue()) return [];
    const today = todayYmd();
    return this.sortByDateDesc(this.postsResource.value() ?? []).filter((p) =>
      isPublished(p, today),
    );
  });

  /** Includes drafts and scheduled posts. Useful for author-review tooling. */
  readonly allPosts = computed(() =>
    this.postsResource.hasValue() ? this.sortByDateDesc(this.postsResource.value() ?? []) : [],
  );

  readonly latestPosts = computed(() => this.posts().slice(0, 2));
  readonly loading = computed(() => this.postsResource.isLoading());
  readonly error = computed(() =>
    this.postsResource.error() ? 'Failed to load blog posts' : null,
  );

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
