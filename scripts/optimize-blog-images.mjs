#!/usr/bin/env node
/**
 * One-off image optimizer for blog assets.
 *
 * Walks every image under `src/assets/images/blog/`, generates a WebP sibling
 * (resized to MAX_WIDTH on the long edge, quality 82), and reports before/after
 * sizes. Idempotent: skips files whose .webp already exists and is newer than
 * the source.
 *
 * Usage:
 *   node scripts/optimize-blog-images.mjs               # optimize, keep originals
 *   node scripts/optimize-blog-images.mjs --replace     # also delete the originals
 */
import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, parse, relative } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('../src/assets/images/blog', import.meta.url).pathname;
const MAX_WIDTH = 1600;
const QUALITY = 82;
const REPLACE = process.argv.includes('--replace');

const SRC_EXT = new Set(['.jpg', '.jpeg', '.png']);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function fmt(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

async function run() {
  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let skipped = 0;

  for (const src of walk(ROOT)) {
    const { dir, name, ext } = parse(src);
    if (!SRC_EXT.has(ext.toLowerCase())) continue;

    const dest = join(dir, `${name}.webp`);
    const srcStat = statSync(src);

    if (existsSync(dest) && statSync(dest).mtimeMs > srcStat.mtimeMs) {
      skipped++;
      continue;
    }

    await sharp(src)
      .rotate() // honour EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(dest);

    const destStat = statSync(dest);
    totalBefore += srcStat.size;
    totalAfter += destStat.size;
    processed++;

    const rel = relative(ROOT, src);
    const ratio = ((1 - destStat.size / srcStat.size) * 100).toFixed(1);
    console.log(`  ${rel}: ${fmt(srcStat.size)} -> ${fmt(destStat.size)} (-${ratio}%)`);

    if (REPLACE) unlinkSync(src);
  }

  console.log('');
  console.log(`Processed ${processed} image(s), skipped ${skipped} unchanged.`);
  console.log(
    `Total: ${fmt(totalBefore)} -> ${fmt(totalAfter)} ` +
      `(-${totalBefore ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0}%)`,
  );
  if (!REPLACE && processed > 0) {
    console.log('');
    console.log('Originals kept. Pass --replace to delete the source files.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
