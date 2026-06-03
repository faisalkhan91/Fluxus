#!/usr/bin/env node
/**
 * Headless structural audit of the prerendered Fluxus build.
 *
 * Guards against silent SSR regressions (e.g. an SSR-thrown binding that
 * leaves every signal interpolation empty in the static HTML — see commit
 * 4b5f5cf for the original incident).
 *
 * Checks per top-level route:
 *  - <title>, <meta name="description">, <link rel="canonical">,
 *    og:url/type/image, twitter:card/image (C1)
 *  - Exactly one <h1> with rendered text (C4 + SSR sanity)
 *  - All <svg> shells carry aria-hidden="true" (C2 / a11y)
 *  - Inline pre-paint theme script is in <head> (C3)
 *  - Skip-to-content link (a11y)
 *  - Editor tabs are <button role="tab"> with valid roving tabindex
 *    and no nested <button> (C6)
 *  - Mobile nav menu trigger advertises aria-haspopup="dialog" (C5)
 *  - Every prerendered blog post advertises og:type=article and contains an
 *    <h1> with rendered text from the markdown body
 *
 * Run via `npm run audit:prerender` after `npm run build:prod`.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { JSDOM } from 'jsdom';
import { walk } from './lib/fs.mjs';
import { SITE_URL } from './lib/config.mjs';

const BUILD_DIR = resolve('dist/fluxus/browser');
const BLOG_DIR = join(BUILD_DIR, 'blog');

const ROUTES = [
  { path: '/', file: 'index.html', title: /Welcome - /, h1Required: true },
  { path: '/about', file: 'about/index.html', title: /^About - /, h1Required: true },
  { path: '/skills', file: 'skills/index.html', title: /^Skills - /, h1Required: true },
  { path: '/projects', file: 'projects/index.html', title: /^Projects - /, h1Required: true },
  {
    path: '/experience',
    file: 'experience/index.html',
    title: /^Experience - /,
    h1Required: true,
  },
  {
    path: '/certifications',
    file: 'certifications/index.html',
    title: /^Certifications - /,
    h1Required: true,
  },
  { path: '/contact', file: 'contact/index.html', title: /^Contact - /, h1Required: true },
  { path: '/blog', file: 'blog/index.html', title: /^Blog - /, h1Required: true },
];

const issues = [];
const wins = [];

function pushIssue(route, msg) {
  issues.push(`[${route}] ${msg}`);
}

function pushWin(route, msg) {
  wins.push(`[${route}] ${msg}`);
}

function loadDoc(file) {
  const full = join(BUILD_DIR, file);
  if (!existsSync(full)) {
    throw new Error(`Missing prerender: ${full}`);
  }
  const html = readFileSync(full, 'utf8');
  return { dom: new JSDOM(html), html };
}

function attr(el, name) {
  return el?.getAttribute?.(name) ?? null;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract the trimmed text of every non-empty <h1> in the raw HTML. We scan
 * the markup directly (not via jsdom) because jsdom doesn't reliably traverse
 * Angular custom elements in the prerendered output.
 */
function extractH1Texts(html) {
  return (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g) ?? [])
    .map((m) =>
      m
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;|&#?\w+;/g, ' ')
        .trim(),
    )
    .filter((t) => t.length > 0);
}

function checkRoute(route) {
  const { dom, html } = loadDoc(route.file);
  const doc = dom.window.document;

  // Title
  const title = doc.querySelector('title')?.textContent?.trim() ?? '';
  if (!route.title.test(title)) {
    pushIssue(route.path, `title does not match expected pattern: "${title}"`);
  } else {
    pushWin(route.path, `title OK ("${title}")`);
  }

  // Description
  const desc = doc.querySelector('meta[name="description"]');
  if (!desc || !attr(desc, 'content')?.trim()) {
    pushIssue(route.path, 'missing or empty <meta name="description">');
  }

  // Canonical
  const canonical = doc.querySelector('link[rel="canonical"]');
  const expectedCanonical = `${SITE_URL}${route.path === '/' ? '/' : route.path}`;
  const canonicalHref = attr(canonical, 'href');
  if (!canonical) {
    pushIssue(route.path, 'missing <link rel="canonical">');
  } else if (canonicalHref !== expectedCanonical) {
    pushIssue(
      route.path,
      `canonical mismatch: got "${canonicalHref}", expected "${expectedCanonical}"`,
    );
  }

  // og:url / og:type / og:image / twitter:card
  for (const [selector, label, expectedRegex] of [
    [`meta[property="og:url"]`, 'og:url', new RegExp(`^${escapeRegExp(expectedCanonical)}$`)],
    [`meta[property="og:type"]`, 'og:type', /^website$/],
    [`meta[property="og:image"]`, 'og:image', new RegExp(`^${escapeRegExp(SITE_URL)}/`)],
    [`meta[name="twitter:card"]`, 'twitter:card', /^summary_large_image$/],
    [`meta[name="twitter:image"]`, 'twitter:image', new RegExp(`^${escapeRegExp(SITE_URL)}/`)],
  ]) {
    const m = doc.querySelector(selector);
    const v = attr(m, 'content');
    if (!m || !v) {
      pushIssue(route.path, `missing ${label}`);
    } else if (!expectedRegex.test(v)) {
      pushIssue(route.path, `${label} mismatch: "${v}"`);
    }
  }

  // h1 (rg over raw HTML — jsdom doesn't traverse Angular custom elements
  // reliably, so we scan the markup directly for <h1>...</h1> with text)
  const h1Texts = extractH1Texts(html);
  if (route.h1Required) {
    if (h1Texts.length === 0) {
      pushIssue(route.path, 'no <h1> with rendered text on route');
    } else if (h1Texts.length > 1) {
      pushIssue(
        route.path,
        `multiple non-empty <h1> elements (${h1Texts.length}): ${h1Texts.join(', ')}`,
      );
    } else {
      pushWin(route.path, `<h1> OK ("${h1Texts[0].slice(0, 40)}")`);
    }
  }

  // Every <ui-icon>-rendered <svg> must carry aria-hidden="true" (and
  // since the v2 icon refactor, the path/line/polyline children are also
  // present in the prerendered HTML — see icons.ts).
  if (/<svg(?![^>]*aria-hidden="true")/i.test(html)) {
    pushIssue(route.path, '<svg> without aria-hidden="true" found');
  } else {
    pushWin(route.path, 'all <svg> shells carry aria-hidden="true"');
  }

  // Pre-paint theme script in <head>
  const headScript = doc.head.querySelector('script')?.textContent ?? '';
  if (!/localStorage\.getItem\('theme'\)/.test(headScript)) {
    pushIssue(route.path, 'pre-paint theme script missing from <head>');
  }

  // Skip-to-content link
  const skip = doc.querySelector('a.skip-link, a[href="#main-content"]');
  if (!skip) {
    pushIssue(route.path, 'skip-to-content link missing');
  }

  // Editor tab bar: every tab is a <button>, not <div>
  if (/<div[^>]*role="tab"/i.test(html)) {
    pushIssue(route.path, '<div role="tab"> found; should be <button>');
  }
  // Capture the WHOLE opening <button ...> tag (up to its closing '>')
  const tabButtonOpens = html.match(/<button\b[^>]*role="tab"[^>]*>/gi) ?? [];
  if (tabButtonOpens.length > 0) {
    let badTabindex = 0;
    for (const btn of tabButtonOpens) {
      const ti = btn.match(/tabindex="(-?\d+)"/);
      if (!ti || (ti[1] !== '0' && ti[1] !== '-1')) badTabindex += 1;
    }
    if (badTabindex > 0) {
      pushIssue(
        route.path,
        `${badTabindex}/${tabButtonOpens.length} tab buttons have invalid tabindex`,
      );
    } else {
      pushWin(route.path, `${tabButtonOpens.length} <button role="tab"> with valid tabindex`);
    }
  }
  // Direct-child nesting check: each tab button's body must not contain another <button>
  for (const fullMatch of html.match(/<button\b[^>]*role="tab"[^>]*>([\s\S]*?)<\/button>/gi) ??
    []) {
    const body = fullMatch.replace(/^<button\b[^>]*>/, '').replace(/<\/button>$/, '');
    if (/<button\b/i.test(body)) {
      pushIssue(route.path, 'nested <button> inside a tab button');
      break;
    }
  }

  // Mobile nav menu trigger should advertise haspopup="dialog"
  const menuTrigger = doc.querySelector('[aria-label="Menu"]');
  if (menuTrigger && attr(menuTrigger, 'aria-haspopup') !== 'dialog') {
    pushIssue(route.path, 'mobile menu trigger missing aria-haspopup="dialog"');
  }

  return { html, doc };
}

function listBlogPostSlugs() {
  if (!existsSync(BLOG_DIR)) return [];
  return readdirSync(BLOG_DIR).filter((entry) => {
    const full = join(BLOG_DIR, entry);
    if (!statSync(full).isDirectory()) return false;
    return existsSync(join(full, 'index.html'));
  });
}

function checkBlogPost(slug) {
  const file = `blog/${slug}/index.html`;
  const route = `/blog/${slug}`;
  const { dom, html } = loadDoc(file);
  const doc = dom.window.document;

  // og:type should be "article" for blog posts
  const ogType = attr(doc.querySelector('meta[property="og:type"]'), 'content');
  if (ogType !== 'article') {
    pushIssue(route, `og:type should be "article", got "${ogType}"`);
  } else {
    pushWin(route, 'og:type=article OK');
  }

  // canonical points at the post
  const canonical = attr(doc.querySelector('link[rel="canonical"]'), 'href');
  const expected = `${SITE_URL}${route}`;
  if (canonical !== expected) {
    pushIssue(route, `canonical mismatch: got "${canonical}", expected "${expected}"`);
  }

  // h1 with rendered text. The post title comes from the markdown body, so
  // a missing <h1> means either the markdown forgot the heading or the
  // SSR markdown render path silently returned empty content.
  const h1Texts = extractH1Texts(html);
  if (h1Texts.length === 0) {
    pushIssue(route, 'no <h1> with rendered text on blog post (check markdown body)');
  } else if (h1Texts.length > 1) {
    pushIssue(route, `multiple non-empty <h1> elements (${h1Texts.length}): ${h1Texts.join(', ')}`);
  } else {
    pushWin(route, `<h1> OK ("${h1Texts[0].slice(0, 40)}")`);
  }
}

/** Strip ?query / #hash and a leading slash to a BUILD_DIR-relative path. */
function normalizeLocalPath(url) {
  return url.split('#')[0].split('?')[0].replace(/^\/+/, '');
}

/**
 * Dead-internal-link + broken-image audit. For every prerendered page:
 *  - each root-relative <a href> resolves to a real file or <dir>/index.html
 *  - each <img src> (and every URL in its srcset) resolves to a real asset
 * A stale post slug, a typo'd routerLink, or a missing/renamed image variant
 * 404s in production today with no test catching it; this closes that gap.
 * Resolution is checked against the actual file tree (not a route allow-list)
 * so nested routes (/projects/<slug>, /blog/tag/<tag>) and static files
 * (feed.xml, favicon.svg, the webmanifest) all validate correctly.
 */
function checkLinksAndImages(absFile) {
  const rel = relative(BUILD_DIR, absFile);
  const route = '/' + rel.replace(/(^|\/)index\.html$/, '$1').replace(/\/$/, '');
  const html = readFileSync(absFile, 'utf8');
  const doc = new JSDOM(html).window.document;

  // Skip noindex pages (draft + future-dated post previews). They're
  // prerendered for author review but are NOT part of the public site graph,
  // and an unpublished post legitimately links to tag archives that only get
  // generated once the post (and its tags) go public — flagging those would
  // be a false positive on intentionally-provisional content.
  const robots = doc.querySelector('meta[name="robots"]');
  if (robots && /noindex/i.test(robots.getAttribute('content') ?? '')) return;

  for (const a of doc.querySelectorAll('a[href^="/"]')) {
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('//')) continue; // protocol-relative = external
    const p = normalizeLocalPath(raw);
    if (p === '') continue; // links to "/" (home)
    if (existsSync(join(BUILD_DIR, p)) || existsSync(join(BUILD_DIR, p, 'index.html'))) continue;
    pushIssue(route, `dead internal link: ${raw}`);
  }

  const imgUrls = new Set();
  for (const img of doc.querySelectorAll('img')) {
    const src = img.getAttribute('src');
    if (src) imgUrls.add(src);
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      for (const part of srcset.split(',')) {
        const u = part.trim().split(/\s+/)[0];
        if (u) imgUrls.add(u);
      }
    }
  }
  for (const u of imgUrls) {
    if (/^(data:|https?:|\/\/)/i.test(u)) continue; // inline / external
    const p = normalizeLocalPath(u);
    if (p === '' || existsSync(join(BUILD_DIR, p))) continue;
    pushIssue(route, `broken image asset: ${u}`);
  }
}

console.log('Auditing prerendered build at', BUILD_DIR);
console.log('---');

for (const route of ROUTES) {
  try {
    checkRoute(route);
  } catch (err) {
    pushIssue(route.path, `audit threw: ${err.message}`);
  }
}

const blogSlugs = listBlogPostSlugs();
if (blogSlugs.length === 0) {
  pushIssue('/blog/*', 'no prerendered blog posts found in dist/fluxus/browser/blog/');
} else {
  for (const slug of blogSlugs) {
    try {
      checkBlogPost(slug);
    } catch (err) {
      pushIssue(`/blog/${slug}`, `audit threw: ${err.message}`);
    }
  }
}

// Dead-link + broken-image sweep across every prerendered page (routes, blog
// posts, project detail pages, tag archives).
let linkPages = 0;
for (const absFile of walk(BUILD_DIR, { filter: (name) => name.endsWith('.html') })) {
  try {
    checkLinksAndImages(absFile);
    linkPages++;
  } catch (err) {
    pushIssue(relative(BUILD_DIR, absFile), `link/image audit threw: ${err.message}`);
  }
}
pushWin('links', `internal-link + image audit ran over ${linkPages} prerendered page(s)`);

console.log(`Wins (${wins.length}):`);
for (const w of wins) console.log('  ✓', w);

console.log(`\nIssues (${issues.length}):`);
for (const i of issues) console.log('  ✗', i);

if (issues.length > 0) {
  process.exit(1);
}
