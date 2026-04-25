#!/usr/bin/env node
/**
 * Generates a 1200x630 PNG Open Graph card per blog post under
 * `dist/fluxus/browser/og/<slug>.png`. Posts that already declare a `cover`
 * field in posts.json win — the generator only fills the gap.
 *
 * Implementation is a hand-rolled SVG template (no satori / React) rasterized
 * via sharp. Keeps the dep surface minimal.
 *
 * Run via `npm run build:prod` (chained after `inject-meta.mjs`, before
 * `build-csp.mjs` so the og/*.png paths exist when CSP scanning runs).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { siteName: SITE_NAME } = require('../site.config.json');

const DIST_BROWSER = join(process.cwd(), 'dist/fluxus/browser');
const OUT_DIR = join(DIST_BROWSER, 'og');
const POSTS_JSON = join(process.cwd(), 'src/assets/blog/posts.json');

if (!existsSync(DIST_BROWSER)) {
  console.error('dist/fluxus/browser/ does not exist — run `ng build` first.');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const posts = JSON.parse(readFileSync(POSTS_JSON, 'utf-8'));

function escape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Wraps a string at the given character budget so titles render across 1–3
 * lines without overflowing the SVG canvas. Honors word boundaries.
 */
function wrap(text, perLine, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > perLine && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && current && !lines.includes(current)) {
    lines[maxLines - 1] = `${lines[maxLines - 1]}…`;
  }
  return lines;
}

function renderSvg(post) {
  const titleLines = wrap(post.title, 28, 3);
  const tagPills = (post.tags || [])
    .slice(0, 4)
    .map((tag, i) => {
      const xOffset = 80 + i * 150;
      return `<g transform="translate(${xOffset}, 510)">
        <rect width="130" height="36" rx="8" fill="rgba(201,42,42,0.18)" />
        <text x="65" y="24" text-anchor="middle" font-family="ui-monospace,monospace" font-size="16" fill="#e03131">${escape(tag)}</text>
      </g>`;
    })
    .join('');

  const titleText = titleLines
    .map((line, i) => {
      const y = 220 + i * 84;
      return `<text x="80" y="${y}" font-family="ui-sans-serif,system-ui" font-size="64" font-weight="700" fill="#ffffff">${escape(line)}</text>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0e0e14" />
      <stop offset="100%" stop-color="#16161f" />
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.6">
      <stop offset="0%" stop-color="#c92a2a" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#c92a2a" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <text x="80" y="100" font-family="ui-monospace,monospace" font-size="22" fill="rgba(255,255,255,0.5)" letter-spacing="2">// ${escape(SITE_NAME.toUpperCase())}</text>
  ${titleText}
  ${tagPills}
  <text x="80" y="600" font-family="ui-monospace,monospace" font-size="20" fill="rgba(255,255,255,0.6)">faisalkhan.dpdns.org/blog</text>
</svg>`;
}

let generated = 0;
for (const post of posts) {
  // Per-post `cover` field wins; auto-generation only fills missing covers.
  if (post.cover) continue;
  const svg = renderSvg(post);
  const out = join(OUT_DIR, `${post.slug}.png`);
  // sharp can rasterize SVG natively via librsvg.
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, quality: 90 }).toFile(out);
  console.log(`  OG ${post.slug}.png`);
  generated++;
}

console.log(`Wrote ${generated} OG card${generated === 1 ? '' : 's'} to ${OUT_DIR}.`);
