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
 *  - Blog post page advertises og:type=article (C1)
 *
 * Run via `npm run audit:prerender` after `npm run build:prod`.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const BUILD_DIR = resolve('dist/fluxus/browser');
const SITE_URL = 'https://faisalkhan.dpdns.org';

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

const BLOG_POST = {
  path: '/blog/angular-signals-state-management',
  file: 'blog/angular-signals-state-management/index.html',
};

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
    pushIssue(route.path, `canonical mismatch: got "${canonicalHref}", expected "${expectedCanonical}"`);
  }

  // og:url / og:type / og:image / twitter:card
  for (const [selector, label, expectedRegex] of [
    [`meta[property="og:url"]`, 'og:url', new RegExp(`^${expectedCanonical.replace(/[/]/g, '\\/')}$`)],
    [`meta[property="og:type"]`, 'og:type', /^website$/],
    [`meta[property="og:image"]`, 'og:image', new RegExp(`^${SITE_URL}/`)],
    [`meta[name="twitter:card"]`, 'twitter:card', /^summary_large_image$/],
    [`meta[name="twitter:image"]`, 'twitter:image', new RegExp(`^${SITE_URL}/`)],
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
  const h1Matches = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g) ?? [];
  const h1Texts = h1Matches
    .map((m) => m.replace(/<[^>]+>/g, '').replace(/&nbsp;|&#?\w+;/g, ' ').trim())
    .filter((t) => t.length > 0);
  if (route.h1Required) {
    if (h1Texts.length === 0) {
      pushIssue(route.path, 'no <h1> with rendered text on route');
    } else if (h1Texts.length > 1) {
      pushIssue(route.path, `multiple non-empty <h1> elements (${h1Texts.length}): ${h1Texts.join(', ')}`);
    } else {
      pushWin(route.path, `<h1> OK ("${h1Texts[0].slice(0, 40)}")`);
    }
  }

  // <ui-icon>-rendered <svg>s are intentionally empty in SSR (content is
  // injected via a browser-only effect to keep SSR safe and avoid breaking
  // signal interpolations elsewhere on the page). All <svg> shells should
  // still have a11y attributes.
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
      pushIssue(route.path, `${badTabindex}/${tabButtonOpens.length} tab buttons have invalid tabindex`);
    } else {
      pushWin(route.path, `${tabButtonOpens.length} <button role="tab"> with valid tabindex`);
    }
  }
  // Direct-child nesting check: each tab button's body must not contain another <button>
  for (const fullMatch of html.match(/<button\b[^>]*role="tab"[^>]*>([\s\S]*?)<\/button>/gi) ?? []) {
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

function checkBlogPost() {
  const { dom } = loadDoc(BLOG_POST.file);
  const doc = dom.window.document;
  const route = BLOG_POST.path;

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

  // h1 for the post title (raw match, see explanation in checkRoute)
  if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(doc.documentElement.outerHTML)) {
    pushIssue(route, 'no <h1> on blog post');
  } else {
    pushWin(route, '<h1> OK on blog post');
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

try {
  checkBlogPost();
} catch (err) {
  pushIssue(BLOG_POST.path, `audit threw: ${err.message}`);
}

console.log(`Wins (${wins.length}):`);
for (const w of wins) console.log('  ✓', w);

console.log(`\nIssues (${issues.length}):`);
for (const i of issues) console.log('  ✗', i);

if (issues.length > 0) {
  process.exit(1);
}
