/**
 * Filesystem helpers shared across the build/audit scripts.
 *
 * Centralizes the recursive directory walk (previously copy-pasted as a
 * `function* walk(dir)` in build-csp, audit-csp, audit-prerender,
 * optimize-blog-images, build-image-variants, build-image-dims) and the
 * `dist/fluxus/browser` existence guard (duplicated, with the same error
 * string, across build-csp, audit-csp, build-og-cards, build-feed,
 * build-sitemap).
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

/** Absolute path to the prerendered browser build output. */
export const DIST_BROWSER = join(process.cwd(), 'dist/fluxus/browser');

/**
 * Fail fast with the canonical message if the prerendered build is missing,
 * so an out-of-order invocation (running an audit/SEO script without a prior
 * `ng build`) exits immediately instead of part-way through. Returns
 * `DIST_BROWSER` for convenient `const DIST = requireDistBrowser()` use.
 */
export function requireDistBrowser() {
  if (!existsSync(DIST_BROWSER)) {
    console.error('dist/fluxus/browser/ does not exist — run `ng build` first.');
    process.exit(1);
  }
  return DIST_BROWSER;
}

/**
 * Recursively yields the absolute path of every file under `dir`. Pass
 * `{ filter }` to restrict the yielded files by name (e.g. only `.html`);
 * directories are always recursed regardless of the filter.
 */
export function* walk(dir, { filter } = {}) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      yield* walk(full, { filter });
    } else if (!filter || filter(name, full)) {
      yield full;
    }
  }
}

/** Promise-based counterpart to {@link walk} for scripts already on `fs/promises`. */
export async function* walkAsync(dir, { filter } = {}) {
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) {
      yield* walkAsync(full, { filter });
    } else if (!filter || filter(name, full)) {
      yield full;
    }
  }
}
