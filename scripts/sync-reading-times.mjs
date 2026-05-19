#!/usr/bin/env node
/**
 * Recomputes the `readingTime` field on every entry in
 * `src/assets/blog/posts.json` from the matching markdown body, so the value
 * the runtime renders (manifest) stays in sync with the actual prose.
 *
 * This script owns the canonical implementation. The runtime no longer
 * needs a parallel copy in blog.utils.ts — `BlogPostComponent` reads the
 * authoritative `readingTime` straight from the manifest this script
 * regenerates, so every surface (prerender, SPA, sitemap consumer) sees
 * the same value by construction.
 *
 * Run via `npm run sync:reading-times` or implicitly via `prebuild` /
 * `prebuild:prod`. The script is a no-op when nothing changed so it can be
 * safely re-run from CI without producing dirty diffs.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MANIFEST = join(ROOT, 'src/assets/blog/posts.json');
const POSTS_DIR = join(ROOT, 'src/assets/blog/posts');

const WORDS_PER_MINUTE = 220;

/**
 * Strips a markdown body to plain prose so word counts and reading-time
 * estimates aren't inflated by code blocks, HTML markup, or image
 * descriptors. Returns the cleaned text — callers reduce it further.
 */
function stripToProse(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/[#*_`>~|-]+/g, ' ');
}

/**
 * Word count of the prose-only body. Exposed via posts.json so
 * downstream consumers (inject-meta.mjs's BlogPosting JSON-LD,
 * potential Twitter Card data labels) can read it without re-deriving
 * from the markdown file. Always returns 0 for an empty body.
 */
function computeWordCount(body) {
  if (!body) return 0;
  return stripToProse(body).split(/\s+/).filter(Boolean).length;
}

/**
 * Estimates a human-friendly reading time. Reuses the prose-strip
 * helper so word-counting logic stays consistent with computeWordCount.
 * Always returns at least "1 min" for a non-empty body. Canonical
 * implementation lives here; the runtime reads the resulting field
 * from posts.json.
 */
function computeReadingTime(body) {
  if (!body) return '0 min';
  const words = computeWordCount(body);
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min`;
}

const manifest = JSON.parse(await readFile(MANIFEST, 'utf-8'));
let changed = 0;
const skipped = [];

for (const post of manifest) {
  const file = join(POSTS_DIR, `${post.slug}.md`);
  if (!existsSync(file)) {
    skipped.push(post.slug);
    continue;
  }
  const body = await readFile(file, 'utf-8');
  const nextReadingTime = computeReadingTime(body);
  const nextWordCount = computeWordCount(body);
  if (post.readingTime !== nextReadingTime || post.wordCount !== nextWordCount) {
    post.readingTime = nextReadingTime;
    post.wordCount = nextWordCount;
    changed++;
  }
}

// Format through prettier using the project config so arrays stay inline
// (printWidth 100) and the diff matches `npm run format:check`. Falling back
// to plain JSON.stringify keeps the script usable if prettier isn't installed.
const before = await readFile(MANIFEST, 'utf-8');
let serialized = JSON.stringify(manifest, null, 2) + '\n';
try {
  const prettier = await import('prettier');
  const config = (await prettier.resolveConfig(MANIFEST)) ?? {};
  serialized = await prettier.format(serialized, { ...config, filepath: MANIFEST });
} catch {
  // Prettier missing — keep the JSON.stringify output. CI will surface the
  // formatting drift via `npm run format:check`.
}
if (serialized !== before) {
  await writeFile(MANIFEST, serialized, 'utf-8');
}

if (skipped.length > 0) {
  console.warn(
    `sync-reading-times: skipped ${skipped.length} entrie(s) without a matching .md: ${skipped.join(', ')}`,
  );
}
console.log(
  `sync-reading-times: ${changed} updated, ${manifest.length - changed - skipped.length} unchanged.`,
);
