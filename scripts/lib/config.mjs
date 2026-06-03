/**
 * Single load point for `site.config.json`, so the build/audit scripts
 * (build-sitemap, build-feed, build-og-cards, inject-meta, audit-prerender)
 * all read the same SITE_URL / SITE_NAME / TWITTER_HANDLE instead of each
 * re-`require`-ing the JSON (or, in audit-prerender's case, hardcoding the
 * URL and silently failing the audit after a domain change).
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('../../site.config.json');

/** Canonical site origin, e.g. `https://faisalkhan.dpdns.org` (no trailing slash). */
export const SITE_URL = config.siteUrl;

/** Human-readable site name used in titles, OG tags, and the feed. */
export const SITE_NAME = config.siteName;

/** Twitter/X handle (`@name`) or empty string when unset; trimmed like inject-meta did. */
export const TWITTER_HANDLE = (config.twitterHandle ?? '').trim();
