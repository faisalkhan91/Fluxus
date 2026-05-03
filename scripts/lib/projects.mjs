/**
 * Build-script helpers that read the project catalog without standing up
 * Angular's DI graph. The canonical source of truth is
 * `src/app/core/services/projects-data.service.ts`, but `.mjs` scripts
 * can't import TS modules directly. Rather than maintain a parallel
 * JSON manifest (and risk drift), we regex-extract the few fields each
 * caller needs from the TS source.
 *
 * The TS file's literal shape is intentionally simple (one `signal<...>`
 * wrapping an array of object literals), so a lenient regex stays
 * stable across edits. If someone introduces dynamic project data, both
 * this module and `app.routes.server.ts` will need to switch to a
 * proper TS import (via `tsx` or pre-compiled JSON).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PROJECTS_TS = join(process.cwd(), 'src/app/core/services/projects-data.service.ts');

/**
 * Mirrors `slugify()` in `src/app/shared/utils/string.utils.ts`. Kept
 * inline so this module has zero TS deps. The blog scripts duplicate
 * the same regex chain for the same reason — verified consistent by
 * the prerender-route generator in `app.routes.server.ts`.
 */
export function projectTagSlug(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const GITHUB_CACHE = join(process.cwd(), 'scripts/cache/projects-github.json');

/**
 * Returns `{ slug, label }[]` — one entry per distinct project tag,
 * sorted alphabetically by slug. The label is whichever capitalisation
 * the catalog uses (matches what the runtime tag archive renders in
 * the heading).
 *
 * Also unions in any topics cached from the GitHub enrichment pass
 * (`scripts/cache/projects-github.json`). Those topics become first-class
 * archive routes once `ProjectsDataService` merges them into `project.tags`
 * at runtime — see the prerender helper in `app.routes.server.ts` which
 * enumerates the same merged surface. Without this union the sitemap and
 * the prerendered files would diverge: Angular would prerender the tag
 * pages, but they'd be absent from sitemap.xml.
 */
export async function loadProjectTagSlugs() {
  const src = await readFile(PROJECTS_TS, 'utf-8');
  const tagBlocks = [...src.matchAll(/tags:\s*\[([^\]]+)\]/g)];
  const bySlug = new Map();
  for (const block of tagBlocks) {
    const tags = [...block[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const tag of tags) {
      const slug = projectTagSlug(tag);
      if (!slug) continue;
      if (!bySlug.has(slug)) bySlug.set(slug, { slug, label: tag });
    }
  }
  try {
    const cache = JSON.parse(await readFile(GITHUB_CACHE, 'utf-8'));
    for (const row of Object.values(cache)) {
      for (const topic of row?.topics ?? []) {
        const slug = projectTagSlug(topic);
        if (!slug) continue;
        // Hand-curated wins on collision — don't overwrite the label
        // if a slug-equal tag already exists.
        if (!bySlug.has(slug)) bySlug.set(slug, { slug, label: topic });
      }
    }
  } catch {
    // Cache missing or unreadable — stay with hand tags only.
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Returns `{ titleSlug, title, link }[]` — one entry per project in
 * source order. Used by the GitHub enrichment script to locate the
 * repo a link points at, and to key the generated metadata by the
 * same slug the runtime `ProjectsDataService` will compute.
 *
 * The lexer is block-scoped: it matches each `{ ... }` object literal
 * inside the outer array, then regex-pulls `title` and `link` from
 * that block. Object-literal order and the `title`/`link` field names
 * are stable in the catalog today; if either changes, this helper is
 * the single point of repair (and will fail loudly rather than return
 * partial data).
 */
export async function loadProjectEntries() {
  const src = await readFile(PROJECTS_TS, 'utf-8');
  // Match whichever array opener the service uses today. `RawProject` is
  // the in-service shape without derived fields; `Project` is retained
  // for defensive support if the service is ever simplified back.
  const arrayStart = (() => {
    for (const opener of ['RawProject[] = [', 'Project[]>([', 'Project[] = [']) {
      const idx = src.indexOf(opener);
      if (idx !== -1) return idx + opener.length - 1;
    }
    return -1;
  })();
  if (arrayStart === -1) {
    throw new Error(
      `projects.mjs: could not find a known projects array opener in ${PROJECTS_TS}`,
    );
  }
  const body = src.slice(arrayStart);
  const entries = [];
  // Match every balanced `{ ... }` block until the first `]` that closes
  // the outer array. The catalog never nests object literals inside a
  // project entry (all values are strings / booleans / string arrays),
  // so a shallow `{ ... }` regex is sufficient.
  const blockRe = /\{[^{}]*\}/g;
  const arrayEnd = body.indexOf('])');
  const scope = arrayEnd === -1 ? body : body.slice(0, arrayEnd);
  for (const match of scope.matchAll(blockRe)) {
    const block = match[0];
    const title = block.match(/title:\s*['"]([^'"]+)['"]/)?.[1];
    const link = block.match(/link:\s*['"]([^'"]+)['"]/)?.[1];
    if (!title || !link) continue;
    entries.push({ titleSlug: projectTagSlug(title), title, link });
  }
  return entries;
}
