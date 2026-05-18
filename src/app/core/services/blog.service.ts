import { Injectable, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { BlogPost } from '@shared/models/blog-post.model';

/**
 * `YYYY-MM-DD` for "today" in UTC. The `posts.json` `date` field is also a
 * `YYYY-MM-DD` literal, so a lex comparison answers "has this post's calendar
 * day arrived yet?" without having to reason about timezones (matches the
 * technique already used in scripts/build-feed.mjs and scripts/build-sitemap.mjs).
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
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);

  // Reactive resource: kicks off eagerly, exposes value/isLoading/error as
  // signals, and stays in sync with HttpClient (interceptors, transfer cache).
  // Note: per-post markdown is fetched directly inside BlogPostComponent so
  // that the heavy `marked` + `highlight.js` graph stays out of any chunk
  // that imports BlogService (e.g. the home route via HeroComponent).
  private postsResource = httpResource<BlogPost[]>(() => 'assets/blog/posts.json', {
    defaultValue: [],
  });

  /**
   * "Today" in UTC, exposed as a signal so the published-post gate has a
   * proper dep in the reactive graph. Without this, `todayYmd()` called
   * inside the `computed()` body was invisible to the signal graph — and
   * since the underlying `postsResource.value()` never changes once
   * loaded, scheduled posts never appeared on a long-lived tab without
   * a manual reload.
   *
   * Refreshed on `visibilitychange` when the tab becomes visible, which
   * catches the common case (user leaves a tab open overnight, returns
   * the next day, scheduled posts surface without a reload). Browser-
   * only — SSR captures the build date and that becomes the prerendered
   * filter; client hydration starts with the same value (a tab opened
   * in the same UTC day as the build will agree exactly) and refreshes
   * itself on the next visibility flip.
   */
  private todaySignal = signal(todayYmd());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    const onVisibility = () => {
      if (this.document.visibilityState === 'visible') {
        this.todaySignal.set(todayYmd());
      }
    };
    this.document.addEventListener('visibilitychange', onVisibility);
    this.destroyRef.onDestroy(() =>
      this.document.removeEventListener('visibilitychange', onVisibility),
    );
  }

  /**
   * Public surfaces (blog list, hero "latest", tag archive, post page) only
   * see published posts — non-draft AND with a publish date of today or
   * earlier. Drafts and future-dated (scheduled) posts are still prerendered
   * at their /blog/<slug> URL so the author can review them, but they're
   * omitted everywhere a casual visitor might bump into them — matching the
   * way build-feed.mjs and build-sitemap.mjs already filter.
   */
  readonly posts = computed<BlogPost[]>(() => {
    if (!this.postsResource.hasValue()) return [];
    const today = this.todaySignal();
    return this.sortByDateDesc(this.postsResource.value() ?? []).filter((p) =>
      isPublished(p, today),
    );
  });

  /** Includes drafts and scheduled posts. Useful for author-review tooling. */
  readonly allPosts = computed<BlogPost[]>(() =>
    this.postsResource.hasValue() ? this.sortByDateDesc(this.postsResource.value() ?? []) : [],
  );

  readonly latestPosts = computed<BlogPost[]>(() => this.posts().slice(0, 2));
  readonly loading = computed<boolean>(() => this.postsResource.isLoading());
  readonly error = computed<string | null>(() =>
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
    // ISO `YYYY-MM-DD` is lexicographically monotone with calendar order,
    // so a string compare gives the same result as `new Date(...).getTime()`
    // without allocating two Date objects per comparison.
    return [...posts].sort((a, b) => b.date.localeCompare(a.date));
  }
}
