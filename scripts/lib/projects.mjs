/**
 * Build-script helpers that read the project catalog.
 *
 * Source of truth since the GitHub-sourced refactor:
 *   `src/app/core/data/projects.generated.json` — a JSON mirror of
 *   `projects.generated.ts`, emitted by `scripts/fetch-projects-github.mjs`
 *   at build time. Scripts consume the JSON so they don't need a TS
 *   compiler in the `.mjs` pipeline, and the Angular bundle imports the
 *   `.ts` file. Both are always re-generated together.
 *
 * If the generated JSON is missing (fresh checkout, script never ran),
 * callers fail loudly rather than silently emitting empty sitemap/
 * prerender lists — the build-chain is supposed to run `fetch:projects`
 * before anything else touches this module.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const GENERATED_JSON = join(process.cwd(), 'src/app/core/data/projects.generated.json');

/**
 * Mirrors `slugify()` in `src/app/shared/utils/string.utils.ts`. Kept
 * inline so this module has zero TS deps. Also re-used by
 * `scripts/fetch-projects-github.mjs` so tags, topics, and titles all
 * normalise the same way across the build pipeline.
 */
export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadGenerated() {
  if (!existsSync(GENERATED_JSON)) {
    throw new Error(
      `projects.mjs: ${GENERATED_JSON} is missing. Run \`npm run fetch:projects\` before scripts that enumerate projects.`,
    );
  }
  try {
    const raw = JSON.parse(await readFile(GENERATED_JSON, 'utf-8'));
    if (!Array.isArray(raw)) {
      throw new Error(`projects.mjs: ${GENERATED_JSON} is not a JSON array`);
    }
    return raw;
  } catch (err) {
    throw new Error(`projects.mjs: could not parse ${GENERATED_JSON}: ${err.message}`);
  }
}

/**
 * Returns `{ slug, label }[]` — one entry per distinct project tag,
 * sorted alphabetically by slug. The label is whichever capitalisation
 * the catalog uses (matches what the runtime tag archive renders in
 * the heading). `tags` in the generated file already includes GitHub
 * topics merged with any hand-curated tags from overrides, so there's
 * no separate union step here.
 */
export async function loadProjectTagSlugs() {
  const projects = await loadGenerated();
  const bySlug = new Map();
  for (const project of projects) {
    for (const tag of project.tags ?? []) {
      const slug = slugify(tag);
      if (!slug) continue;
      if (!bySlug.has(slug)) bySlug.set(slug, { slug, label: tag });
    }
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Returns `{ titleSlug, title, description, image, link, tags[] }[]` —
 * one entry per project in the canonical (post-merge) order. Used by
 * `scripts/inject-meta.mjs` to build the per-project `<head>` tags and
 * by `scripts/build-sitemap.mjs` to enumerate the `/projects/:slug`
 * detail route URLs.
 */
export async function loadProjectEntries() {
  const projects = await loadGenerated();
  return projects.map((p) => ({
    titleSlug: p.slug || slugify(p.title),
    title: p.title,
    description: p.description ?? '',
    image: p.image ?? '',
    link: p.link ?? '',
    tags: p.tags ?? [],
  }));
}
