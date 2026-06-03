/**
 * Shared, dependency-free helpers for blog content.
 *
 * Used across the Angular components (blog index, hero, tag archive, post
 * SEO). The Node-side build scripts use the parallel `scripts/lib/posts.mjs`
 * since `.mjs` can't import `.ts`; the two intentionally mirror each other.
 */
import type { BlogPost } from '@shared/models/blog-post.model';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/**
 * Formats an ISO date string as "Month D, YYYY" in en-US.
 *
 * Posts.json dates are date-only strings (`YYYY-MM-DD`). `new Date('YYYY-MM-DD')`
 * parses them as UTC midnight and `Intl.DateTimeFormat` then formats them in
 * the viewer's local timezone, which prints the *previous* calendar day for
 * anyone west of UTC (and flips the day on the prerender server too). We parse
 * the components manually as local-midnight so the displayed day always
 * matches the author-intended date and the `<time datetime>` attribute.
 *
 * Returns the original string when parsing fails so the UI never shows
 * "Invalid Date" — a JSON typo surfaces unchanged for the author to spot.
 */
export function formatPostDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match) {
    const [, y, m, d] = match;
    return DATE_FORMATTER.format(new Date(Number(y), Number(m) - 1, Number(d)));
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return DATE_FORMATTER.format(parsed);
}

/**
 * `YYYY-MM-DD` for "today" in UTC. The `posts.json` `date` field is also a
 * `YYYY-MM-DD` literal, so a lex comparison answers "has this post's calendar
 * day arrived yet?" without having to reason about timezones (matches the
 * technique used in scripts/lib/posts.mjs for the build pipeline).
 */
export function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Single source of truth for "should this post show on public surfaces?".
 * A post is public when it is not flagged as draft AND its publish date has
 * already arrived (calendar-day comparison). Used by `BlogService` (index,
 * hero, tag archive, command palette, related/adjacent/series) and by
 * `BlogPostSeoService` (SPA `noindex` gate, as `!isPostPublished`).
 */
export function isPostPublished(post: BlogPost, today: string = todayYmd()): boolean {
  if (post.draft) return false;
  return post.date <= today;
}
