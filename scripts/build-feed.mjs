#!/usr/bin/env node
/**
 * Generates an Atom 1.0 feed at `dist/fluxus/browser/feed.xml` from
 * `src/assets/blog/posts.json`. Atom over RSS because the spec is stricter
 * about `updated` timestamps and the IDs are namespaced (cleaner for
 * crawlers/aggregators).
 *
 * Run via `npm run build:prod` (chained after `inject-meta.mjs`).
 */
import { readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { siteUrl: SITE_URL, siteName: SITE_NAME } = require('../site.config.json');

// Optional positional output path. With no arg, writes to the prod
// build output (chained from `npm run build:prod` after `ng build`).
// Pass any other path to spot-check the feed without a full prod build,
// e.g. `node scripts/build-feed.mjs feed.xml` drops a copy in the repo
// root (gitignored) that you can open in a browser or drag into a feed
// reader to verify formatting/dates after a `posts.json` change.
const customOut = process.argv[2];
const POSTS_JSON = join(process.cwd(), 'src/assets/blog/posts.json');
const FEED_PATH = customOut
  ? resolve(process.cwd(), customOut)
  : join(process.cwd(), 'dist/fluxus/browser/feed.xml');

// The dist/ existence check only matters for the default (prod) path —
// a spot-check run targets the repo root or wherever the user points it.
if (!customOut) {
  try {
    await stat(join(process.cwd(), 'dist/fluxus/browser'));
  } catch {
    console.error('dist/fluxus/browser/ does not exist — run `ng build` first.');
    process.exit(1);
  }
}

function escape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Date-only post strings (`YYYY-MM-DD`) get pinned to **noon UTC** so the
 * published timestamp falls on the author-intended calendar day for every
 * feed reader timezone. UTC midnight would print the previous day in the
 * Americas; local midnight on the build host is non-deterministic.
 */
function postIsoTimestamp(date) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return `${date}T12:00:00Z`;
  return new Date(date).toISOString();
}

const posts = JSON.parse(await readFile(POSTS_JSON, 'utf-8'))
  .filter((p) => !p.draft)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const updated = posts[0]?.date ? postIsoTimestamp(posts[0].date) : new Date().toISOString();

const entries = posts
  .map((post) => {
    const url = `${SITE_URL}/blog/${post.slug}`;
    const published = postIsoTimestamp(post.date);
    return `  <entry>
    <title>${escape(post.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${published}</updated>
    <published>${published}</published>
    <author><name>Faisal Khan</name></author>
    <summary type="html">${escape(post.excerpt)}</summary>
    ${(post.tags || []).map((tag) => `<category term="${escape(tag)}"/>`).join('\n    ')}
  </entry>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title>${escape(SITE_NAME)}</title>
  <subtitle>Engineering blog</subtitle>
  <link href="${SITE_URL}/"/>
  <link rel="self" type="application/atom+xml" href="${SITE_URL}/feed.xml"/>
  <id>${SITE_URL}/</id>
  <updated>${updated}</updated>
  <author><name>Faisal Khan</name></author>
${entries}
</feed>
`;

await writeFile(FEED_PATH, xml, 'utf-8');
console.log(`Wrote ${FEED_PATH} with ${posts.length} entr${posts.length === 1 ? 'y' : 'ies'}.`);
