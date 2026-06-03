#!/usr/bin/env node
/**
 * Generates an Atom 1.0 feed at `dist/fluxus/browser/feed.xml` from
 * `src/assets/blog/posts.json`. Atom over RSS because the spec is stricter
 * about `updated` timestamps and the IDs are namespaced (cleaner for
 * crawlers/aggregators).
 *
 * Run via `npm run build:prod` (chained after `inject-meta.mjs`).
 */
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { SITE_URL, SITE_NAME } from './lib/config.mjs';
import { requireDistBrowser } from './lib/fs.mjs';
import { loadPosts, isPublished, todayYmd } from './lib/posts.mjs';
import { escapeXmlAttr } from './lib/html.mjs';

// Optional positional output path. With no arg, writes to the prod
// build output (chained from `npm run build:prod` after `ng build`).
// Pass any other path to spot-check the feed without a full prod build,
// e.g. `node scripts/build-feed.mjs feed.xml` drops a copy in the repo
// root (gitignored) that you can open in a browser or drag into a feed
// reader to verify formatting/dates after a `posts.json` change.
const customOut = process.argv[2];
const FEED_PATH = customOut
  ? resolve(process.cwd(), customOut)
  : join(process.cwd(), 'dist/fluxus/browser/feed.xml');

// The dist/ existence check only matters for the default (prod) path —
// a spot-check run targets the repo root or wherever the user points it.
if (!customOut) {
  requireDistBrowser();
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

// Scheduled posts (date in the future) are excluded alongside drafts so the
// Atom feed never advertises a post before its publish day — feed-reader
// caches would otherwise pin the entry at its first appearance and never
// surface the on-time publish update. The next prod build that crosses the
// publish boundary picks the entry up.
const today = todayYmd();
const posts = (await loadPosts())
  .filter((p) => isPublished(p, today))
  // Date-descending; secondary slug-ascending so two posts dated the same
  // day always emit in the same order. Without the tiebreaker, equal-date
  // entries swap order across runs and the committed feed.xml diff churns
  // even when no post content changed.
  .sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() || a.slug.localeCompare(b.slug),
  );

/*
  Feed-level <updated> per Atom RFC 4287 §4.2.15: "the most recent instant
  in time when an entry or feed was modified in a way the publisher
  considers significant." Take the max of every entry's `updated ?? date`
  rather than `posts[0].date` so a backfill edit on an older post still
  bumps the feed timestamp — without this, reader caches would stay
  stale even though the post page and JSON-LD `dateModified` already
  reflect the change. Lex comparison is safe because every value is a
  fixed-width Z-terminated RFC 3339 string from `postIsoTimestamp`.
*/
const updated = posts.length
  ? posts.reduce((latest, post) => {
      const candidate = postIsoTimestamp(post.updated ?? post.date);
      return candidate > latest ? candidate : latest;
    }, '')
  : new Date().toISOString();

const entries = posts
  .map((post) => {
    const url = `${SITE_URL}/blog/${post.slug}`;
    const published = postIsoTimestamp(post.date);
    /*
      Entry-level <updated> falls back to the publish date when the post
      has never been edited. Mirrors the post page's "Updated …" label
      (rendered when `post.updated && post.updated !== post.date`) and
      the BlogPosting JSON-LD's `dateModified` so all three surfaces
      agree on revision history.
    */
    const entryUpdated = post.updated ? postIsoTimestamp(post.updated) : published;
    /*
      `type="text"` reflects the actual payload — excerpts are plain
      prose with no HTML markup. `type="html"` would tell readers to
      run an HTML parser over the (escaped) text and risks strict
      readers stripping curly quotes / apostrophes during sanitisation.
    */
    // Every URL interpolation is escaped — slug values are author-
    // controlled and pass through `slugify` (alphanumeric + `-`), so
    // they are XML-safe today. Escaping defensively means a future
    // slug containing `&` (or any XML-significant char) can't produce
    // malformed feed XML and break every subscriber's reader. The
    // `rel="alternate" type="text/html"` attributes on each entry
    // <link> match the Atom spec defaults but are explicit so strict
    // validators / readers don't have to assume.
    return `  <entry>
    <title>${escapeXmlAttr(post.title)}</title>
    <link rel="alternate" type="text/html" href="${escapeXmlAttr(url)}"/>
    <id>${escapeXmlAttr(url)}</id>
    <updated>${entryUpdated}</updated>
    <published>${published}</published>
    <author><name>Faisal Khan</name></author>
    <summary type="text">${escapeXmlAttr(post.excerpt)}</summary>
    ${(post.tags || []).map((tag) => `<category term="${escapeXmlAttr(tag)}"/>`).join('\n    ')}
  </entry>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title>${escapeXmlAttr(SITE_NAME)}</title>
  <subtitle>Engineering blog</subtitle>
  <link rel="alternate" type="text/html" href="${escapeXmlAttr(`${SITE_URL}/`)}"/>
  <link rel="self" type="application/atom+xml" href="${escapeXmlAttr(`${SITE_URL}/feed.xml`)}"/>
  <id>${escapeXmlAttr(`${SITE_URL}/`)}</id>
  <updated>${updated}</updated>
  <author><name>Faisal Khan</name></author>
${entries}
</feed>
`;

await writeFile(FEED_PATH, xml, 'utf-8');
console.log(`Wrote ${FEED_PATH} with ${posts.length} entr${posts.length === 1 ? 'y' : 'ies'}.`);
