/**
 * Blog-manifest helpers shared by the SEO writers (build-sitemap, build-feed,
 * build-og-cards, inject-meta). Centralizes the manifest load and the
 * "published" predicate so crawler-facing surfaces (sitemap, feed, robots
 * meta) can't silently disagree about which posts are public.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const POSTS_JSON = join(process.cwd(), 'src/assets/blog/posts.json');

/** Today's date as a `YYYY-MM-DD` string in UTC. */
export function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

/** Parse and return `src/assets/blog/posts.json` as an array of post entries. */
export async function loadPosts() {
  return JSON.parse(await readFile(POSTS_JSON, 'utf-8'));
}

/**
 * A post is public when it isn't a draft and its date is today-or-earlier.
 * Future-dated posts are still prerendered for author review but excluded
 * from sitemap/feed and marked `noindex` — this predicate is the single
 * source of that rule across the build scripts.
 */
export function isPublished(post, today = todayYmd()) {
  return !post.draft && post.date <= today;
}
