#!/usr/bin/env node
/**
 * Recomputes the `readingTime` field on every entry in
 * `src/assets/blog/posts.json` from the matching markdown body, so the value
 * the runtime renders (manifest) stays in sync with the actual prose.
 *
 * Mirrors `computeReadingTime` in `src/app/shared/utils/blog.utils.ts` (no
 * direct import — that file is part of the Angular bundle and we want this
 * script dependency-free for fast builds).
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
 * 1:1 with `computeReadingTime` in src/app/shared/utils/blog.utils.ts.
 * Keep the two implementations identical so the prerender, the live SPA, and
 * the build script never disagree.
 */
function computeReadingTime(body) {
  if (!body) return '0 min';
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/[#*_`>~|-]+/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
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
  const next = computeReadingTime(body);
  if (post.readingTime !== next) {
    post.readingTime = next;
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
  console.warn(`sync-reading-times: skipped ${skipped.length} entrie(s) without a matching .md: ${skipped.join(', ')}`);
}
console.log(`sync-reading-times: ${changed} updated, ${manifest.length - changed - skipped.length} unchanged.`);
