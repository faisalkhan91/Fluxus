#!/usr/bin/env node
/**
 * Generates a fresh sitemap.xml at build time from `src/assets/blog/posts.json`
 * + a hardcoded static-route list. Writes to `dist/fluxus/browser/sitemap.xml`,
 * overwriting whatever was copied in from `src/sitemap.xml` (which is kept as a
 * dev-time fallback only).
 *
 * Run via `npm run build:prod` (chained after `inject-meta.mjs`).
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadProjectTagSlugs, loadProjectEntries, slugify } from './lib/projects.mjs';
import { SITE_URL } from './lib/config.mjs';
import { requireDistBrowser } from './lib/fs.mjs';
import { loadPosts, isPublished, todayYmd } from './lib/posts.mjs';
import { escapeXmlText } from './lib/html.mjs';

const DIST_SITEMAP = join(process.cwd(), 'dist/fluxus/browser/sitemap.xml');

// Fail fast if the dist directory is missing so an out-of-order
// invocation (e.g. someone running `node scripts/build-sitemap.mjs`
// without a prior `ng build`) doesn't waste time parsing posts.json,
// loading the project catalog, and building the full XML before
// discovering it has nowhere to write. The previous shape ran the
// whole pipeline first and threw away the result.
requireDistBrowser();

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

const posts = await loadPosts();

function urlEntry(loc, priority, lastmod) {
  const lastmodTag = lastmod ? `<lastmod>${escapeXmlText(lastmod)}</lastmod>` : '';
  return `  <url><loc>${escapeXmlText(loc)}</loc>${lastmodTag}<priority>${priority}</priority></url>`;
}

const today = todayYmd();
// Scheduled posts (date in the future) are excluded alongside drafts so the
// sitemap only advertises URLs whose public metadata is also already live.
// Direct /blog/<slug> URLs for those posts are still prerendered for author
// review — see app.routes.server.ts — they just don't get search-indexed.
const livePosts = posts.filter((p) => isPublished(p, today));

// Unique tag slugs across all non-draft posts (matches the prerender list).
const tagSlugs = Array.from(new Set(livePosts.flatMap((p) => (p.tags ?? []).map(slugify))))
  .filter(Boolean)
  .sort();

// `/projects/tag/<slug>` mirrors `/blog/tag/<slug>` — discovered via the
// shared `loadProjectTagSlugs()` helper, which regex-extracts directly
// from the projects-data.service.ts source so this stays in sync without
// a parallel JSON manifest. Sorted for byte-stable sitemap.xml diffs —
// the loader's emit order is regex-match order against the source file,
// which shifts whenever a project is reordered or added.
const projectTagSlugs = (await loadProjectTagSlugs()).map((entry) => entry.slug).sort();

// `/projects/:slug` — one URL per project. Detail pages get a higher
// priority than the tag archive (0.7 vs 0.4) since they are the richer,
// canonical surface for a project. Tag archives remain for discovery.
// Sorted alongside `projectTagSlugs` for the same byte-stability reason.
const projectDetailSlugs = (await loadProjectEntries())
  .map((entry) => entry.titleSlug)
  .filter(Boolean)
  .sort();

const entries = [
  ...STATIC_ROUTES.map(([path, priority]) =>
    urlEntry(`${SITE_URL}${path === '/' ? '/' : path}`, priority, today),
  ),
  ...livePosts.map((p) => urlEntry(`${SITE_URL}/blog/${p.slug}`, '0.8', p.date)),
  ...tagSlugs.map((slug) => urlEntry(`${SITE_URL}/blog/tag/${slug}`, '0.4', today)),
  ...projectTagSlugs.map((slug) => urlEntry(`${SITE_URL}/projects/tag/${slug}`, '0.4', today)),
  ...projectDetailSlugs.map((slug) => urlEntry(`${SITE_URL}/projects/${slug}`, '0.7', today)),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

await writeFile(DIST_SITEMAP, xml, 'utf-8');
console.log(
  `Wrote ${DIST_SITEMAP} with ${STATIC_ROUTES.length} routes + ${livePosts.length} blog posts + ${tagSlugs.length} blog-tag archives + ${projectTagSlugs.length} project-tag archives + ${projectDetailSlugs.length} project detail pages.`,
);
