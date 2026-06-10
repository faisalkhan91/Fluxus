#!/usr/bin/env node
/**
 * Structured-data + social-metadata regression check for the prerendered build.
 *
 * inject-meta.mjs emits JSON-LD (BlogPosting / Article / CollectionPage /
 * BreadcrumbList), Open Graph / Twitter cards, and an Atom feed. None of that
 * is exercised by the unit suite, so a malformed schema, a dropped og:image:alt,
 * or a broken feed could ship green. This walks the real dist output and fails
 * the build on:
 *
 *   1. JSON-LD blocks that don't parse, or lack @context / @type.
 *   2. Any page with an og:image but no og:image:alt (a11y + unfurl quality).
 *   3. An Atom feed.xml that isn't well-formed or is missing required elements
 *      (RFC 4287: feed-level title/id/updated; per-entry id/title/updated/link).
 *
 * Run via `npm run audit:structured-data` (chained at the end of build:prod).
 */
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { DIST_BROWSER, requireDistBrowser, walk } from './lib/fs.mjs';

requireDistBrowser();

const JSONLD_TAG = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
const OG_IMAGE = /<meta\s+property="og:image"\s/i;
const OG_IMAGE_ALT = /<meta\s+property="og:image:alt"\s/i;

const failures = [];
let jsonLdCount = 0;
let pagesWithOgImage = 0;

for (const file of walk(DIST_BROWSER, { filter: (name) => name.endsWith('.html') })) {
  const html = readFileSync(file, 'utf-8');
  const rel = file.slice(DIST_BROWSER.length + 1);

  // 1. JSON-LD validity.
  for (const match of html.matchAll(JSONLD_TAG)) {
    jsonLdCount += 1;
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch (err) {
      failures.push(`${rel}: invalid JSON-LD — ${err.message}`);
      continue;
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== 'object') {
        failures.push(`${rel}: JSON-LD block is not an object`);
        continue;
      }
      if (!node['@context']) failures.push(`${rel}: JSON-LD block missing @context`);
      // A node either declares its own @type, or is a @graph container whose
      // members each carry a @type (the site-wide Person + WebSite graph).
      if (Array.isArray(node['@graph'])) {
        for (const member of node['@graph']) {
          if (!member || typeof member !== 'object' || !member['@type']) {
            failures.push(`${rel}: JSON-LD @graph member missing @type`);
          }
        }
      } else if (!node['@type']) {
        failures.push(`${rel}: JSON-LD block missing @type`);
      }
    }
  }

  // 2. og:image must be paired with og:image:alt.
  if (OG_IMAGE.test(html)) {
    pagesWithOgImage += 1;
    if (!OG_IMAGE_ALT.test(html)) {
      failures.push(`${rel}: has og:image but no og:image:alt`);
    }
  }
}

// 3. Atom feed well-formedness (RFC 4287).
const FEED_FILE = join(DIST_BROWSER, 'feed.xml');
let feedEntries = 0;
if (!statSync(FEED_FILE, { throwIfNoEntry: false })?.isFile()) {
  failures.push('feed.xml is missing from the build output');
} else {
  const xml = readFileSync(FEED_FILE, 'utf-8');
  const doc = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
  if (doc.getElementsByTagName('parsererror').length > 0) {
    failures.push('feed.xml is not well-formed XML');
  }
  const feed = doc.getElementsByTagName('feed')[0];
  if (!feed) {
    failures.push('feed.xml has no <feed> root');
  } else {
    const childText = (parent, tag) => {
      for (const el of parent.children)
        if (el.tagName === tag) return (el.textContent ?? '').trim();
      return '';
    };
    for (const required of ['title', 'id', 'updated']) {
      if (!childText(feed, required)) failures.push(`feed.xml <feed> missing <${required}>`);
    }
    const entries = Array.from(feed.getElementsByTagName('entry'));
    feedEntries = entries.length;
    if (entries.length === 0) failures.push('feed.xml has zero <entry> elements');
    entries.forEach((entry, i) => {
      for (const required of ['id', 'title', 'updated']) {
        if (!childText(entry, required))
          failures.push(`feed.xml entry #${i + 1} missing <${required}>`);
      }
      if (entry.getElementsByTagName('link').length === 0) {
        failures.push(`feed.xml entry #${i + 1} missing <link>`);
      }
    });
  }
}

if (failures.length > 0) {
  console.error(`\n✗ structured-data audit: ${failures.length} issue(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `OK — ${jsonLdCount} JSON-LD block(s) valid, ${pagesWithOgImage} og:image page(s) carry og:image:alt, Atom feed well-formed (${feedEntries} entries).\n` +
    `✓ structured-data: pass`,
);
