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

/**
 * Returns `{ slug, label }[]` — one entry per distinct project tag,
 * sorted alphabetically by slug. The label is whichever capitalisation
 * the catalog uses (matches what the runtime tag archive renders in
 * the heading).
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
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}
