#!/usr/bin/env node
/**
 * Production CSP probe. Headless Chromium loads a handful of representative
 * routes from the live deployment and fails if Chromium reports any
 * Content-Security-Policy violation in the console or as a pageerror.
 *
 * Catches edge-injected things the offline build can't see — e.g.
 * Cloudflare Insights beacon variants, Rocket Loader rewrites, or any
 * future CDN HTML transform that drops a script the CSP doesn't allow.
 *
 * Invoked from `.github/workflows/smoke.yml` after the daily /healthz
 * probe. Reads the base URL from $SMOKE_URL.
 */
import { chromium } from 'playwright';

const SMOKE_URL = process.env['SMOKE_URL'];
if (!SMOKE_URL) {
  console.error('SMOKE_URL env var is required (set as a repo variable).');
  process.exit(1);
}

const base = SMOKE_URL.replace(/\/$/, '');

// `BLOG_SLUG` is overridable so the workflow can pass the slug of the
// most-recently-published post without us hard-coding a moving target
// here. Falls back to a known stable post when unset.
const blogSlug = process.env['BLOG_SLUG'] || 'homelab-storage-foundation';

const ROUTES = [`${base}/`, `${base}/blog`, `${base}/blog/${blogSlug}`];

const CSP_VIOLATION_PATTERN = /Content[- ]Security[- ]Policy|Refused to (load|execute|apply)/i;

const browser = await chromium.launch();
let exitCode = 0;

try {
  for (const url of ROUTES) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const violations = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (CSP_VIOLATION_PATTERN.test(text)) violations.push(`console: ${text}`);
    });
    page.on('pageerror', (err) => {
      const text = err.message;
      if (CSP_VIOLATION_PATTERN.test(text)) violations.push(`pageerror: ${text}`);
    });

    process.stdout.write(`probe ${url} ... `);
    try {
      // 30s navigation budget — enough for a cold CDN edge or a loaded Pi
      // node, short enough that a real outage fails the daily smoke run
      // promptly.
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    } catch (err) {
      console.log('NAV_ERR');
      console.error(`  navigation failed: ${err.message}`);
      exitCode = 1;
      await context.close();
      continue;
    }

    if (violations.length === 0) {
      console.log('OK');
    } else {
      console.log(`FAIL (${violations.length} violation${violations.length === 1 ? '' : 's'})`);
      for (const v of violations) console.error(`  ${v}`);
      exitCode = 1;
    }

    await context.close();
  }
} finally {
  await browser.close();
}

if (exitCode !== 0) {
  console.error('\nProduction CSP probe failed. Open the workflow log for details.');
}
process.exit(exitCode);
