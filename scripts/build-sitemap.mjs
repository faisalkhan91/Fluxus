#!/usr/bin/env node
/**
 * Generates a fresh sitemap.xml at build time from `src/assets/blog/posts.json`
 * + a hardcoded static-route list. Writes to `dist/fluxus/browser/sitemap.xml`,
 * overwriting whatever was copied in from `src/sitemap.xml` (which is kept as a
 * dev-time fallback only).
 *
 * Run via `npm run build:prod` (chained after `inject-meta.mjs`).
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { siteUrl: SITE_URL } = require('../site.config.json');

const DIST_SITEMAP = join(process.cwd(), 'dist/fluxus/browser/sitemap.xml');
const POSTS_JSON = join(process.cwd(), 'src/assets/blog/posts.json');

// Tuple of [path, priority]. Order is the order they appear in the sitemap.
// Keep in sync with src/app/app.routes.ts. Verified by the contract test in
// src/app/core/services/navigation.service.spec.ts.
const STATIC_ROUTES = [
  ['/', '1.0'],
  ['/about', '0.8'],
  ['/experience', '0.8'],
  ['/skills', '0.7'],
  ['/projects', '0.7'],
  ['/certifications', '0.7'],
  ['/contact', '0.6'],
  ['/blog', '0.9'],
];

const posts = JSON.parse(await readFile(POSTS_JSON, 'utf-8'));

function escape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlEntry(loc, priority, lastmod) {
  const lastmodTag = lastmod ? `<lastmod>${escape(lastmod)}</lastmod>` : '';
  return `  <url><loc>${escape(loc)}</loc>${lastmodTag}<priority>${priority}</priority></url>`;
}

// Tag-archive slug helper (must match `slugify` in src/app/shared/utils/string.utils.ts).
function tagSlug(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const today = new Date().toISOString().slice(0, 10);
// Scheduled posts (date in the future) are excluded alongside drafts so the
// sitemap only advertises URLs whose public metadata is also already live.
// Direct /blog/<slug> URLs for those posts are still prerendered for author
// review — see app.routes.server.ts — they just don't get search-indexed.
const livePosts = posts.filter((p) => !p.draft && p.date <= today);

// Unique tag slugs across all non-draft posts (matches the prerender list).
const tagSlugs = Array.from(new Set(livePosts.flatMap((p) => (p.tags ?? []).map(tagSlug))))
  .filter(Boolean)
  .sort();

const entries = [
  ...STATIC_ROUTES.map(([path, priority]) =>
    urlEntry(`${SITE_URL}${path === '/' ? '/' : path}`, priority, today),
  ),
  ...livePosts.map((p) => urlEntry(`${SITE_URL}/blog/${p.slug}`, '0.8', p.date)),
  ...tagSlugs.map((slug) => urlEntry(`${SITE_URL}/blog/tag/${slug}`, '0.4', today)),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

try {
  await stat(join(process.cwd(), 'dist/fluxus/browser'));
} catch {
  console.error('dist/fluxus/browser/ does not exist — run `ng build` first.');
  process.exit(1);
}

await writeFile(DIST_SITEMAP, xml, 'utf-8');
console.log(
  `Wrote ${DIST_SITEMAP} with ${STATIC_ROUTES.length} routes + ${livePosts.length} blog posts + ${tagSlugs.length} tag archives.`,
);
