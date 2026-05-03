#!/usr/bin/env node
/**
 * Builds the canonical project list by merging a hand-edited override
 * manifest (`src/app/core/data/projects.overrides.json`) with GitHub
 * repo metadata fetched at build time. Emits two artefacts:
 *
 *   1. `src/app/core/data/projects.generated.ts` — the full `Project[]`
 *      imported by `ProjectsDataService`. Committed.
 *   2. `src/app/core/data/projects.generated.json` — JSON mirror of the
 *      same list for `.mjs` consumers (sitemap, inject-meta, prerender).
 *   3. `scripts/cache/projects-github.json` — normalized GitHub fetch
 *      cache, keyed by `owner/name` lowercased. Offline fallback.
 *
 * Selection model (union of both):
 *   - Every entry in `overrides.repos[]` (must-include allowlist).
 *   - Every public repo matching the topic filter when present
 *     (`topic:portfolio fork:false archived:false`), via the Search API.
 *
 * Plus any `overrides.manual[]` entries are appended as manual
 * projects (no github block).
 *
 * Rate-limit safety:
 *   - Unauthenticated REST = 60/hr (per IP). N=6 repos × 5 endpoints
 *     = 30 calls. Fine.
 *   - `GITHUB_TOKEN` when present gets us 5000/hr.
 *   - Any fetch failure falls through to the cached value for that
 *     repo; only a completely cold cache + completely offline build
 *     fails the script.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OVERRIDES_JSON = join(ROOT, 'src/app/core/data/projects.overrides.json');
const GENERATED_TS = join(ROOT, 'src/app/core/data/projects.generated.ts');
const GENERATED_JSON = join(ROOT, 'src/app/core/data/projects.generated.json');
const CACHE_JSON = join(ROOT, 'scripts/cache/projects-github.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';
const USER_AGENT = 'fluxus-build-fetch';

/**
 * Inline Linguist palette. Extend when a new language appears in any
 * repo. The full `linguist-languages` npm package is ~80KB; the list
 * below covers every language actually in use across the portfolio.
 */
const LANGUAGE_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  C: '#555555',
  'C++': '#f34b7d',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Dockerfile: '#384d54',
  HCL: '#844FBA',
  Jupyter: '#DA5B0B',
  Makefile: '#427819',
  Groovy: '#4298b8',
  Roff: '#ecdebe',
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ghHeaders(mediaType = 'application/vnd.github+json') {
  const headers = {
    Accept: mediaType,
    'User-Agent': USER_AGENT,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

async function tryFetch(url, { mediaType } = {}) {
  try {
    const res = await fetch(url, { headers: ghHeaders(mediaType) });
    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`fetch-projects-github: WARN ${url} → ${res.status} ${res.statusText}`);
      }
      return null;
    }
    if (mediaType && mediaType.includes('raw')) {
      return await res.text();
    }
    return await res.json();
  } catch (err) {
    console.warn(`fetch-projects-github: WARN network failure for ${url}: ${err.message}`);
    return null;
  }
}

/**
 * Selection: union of allowlist (`overrides.repos[].repo`) and topic
 * search results (when topic filter is set). Returns a Map keyed by
 * `owner/name` lowercased so callers can de-dup and merge overrides.
 */
async function selectRepos(overrides) {
  const selected = new Map();
  // Allowlist is always authoritative: even if GitHub is down, these
  // repos still show up (their cached metadata gets used below).
  for (const entry of overrides.repos ?? []) {
    if (!entry.repo) continue;
    const key = entry.repo.toLowerCase();
    selected.set(key, { nameWithOwner: entry.repo, override: entry });
  }
  // Topic search adds any *additional* repos tagged by the user that
  // aren't already in the allowlist. MUST be scoped to the user
  // (`user:X topic:Y`) — without the user scope we'd pull in every
  // public repo on GitHub that happens to share the topic string.
  const topic = overrides.topic;
  const user = overrides.user;
  if (topic && user) {
    const q = encodeURIComponent(`user:${user} topic:${topic} fork:false archived:false`);
    const url = `https://api.github.com/search/repositories?q=${q}&per_page=50`;
    const json = await tryFetch(url);
    if (json && Array.isArray(json.items)) {
      for (const item of json.items) {
        if (!item?.full_name) continue;
        const key = item.full_name.toLowerCase();
        if (selected.has(key)) continue;
        selected.set(key, { nameWithOwner: item.full_name, override: null });
      }
    }
  } else if (topic && !user) {
    console.warn(
      'fetch-projects-github: `topic` set in overrides but no `user`; skipping topic search to avoid pulling in every public repo on GitHub.',
    );
  }
  return selected;
}

/**
 * Strip markdown syntax from the README and collapse to ~500 chars of
 * plain prose. Deliberately not a full marked + sanitizer pass —
 * third-party content should never hit a rich-text renderer on this
 * site.
 */
function extractReadmeExcerpt(md, repoName) {
  if (typeof md !== 'string' || !md.trim()) return null;
  let text = md;
  text = text.replace(/^\s*#\s+([^\n]+)\n+/, (m, heading) =>
    heading.trim().toLowerCase() === repoName.toLowerCase() ? '' : m,
  );
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  text = text.replace(/^(?:\s*\[!\[.*?\]\(.*?\)\]\(.*?\)\s*)+$/gm, ' ');
  text = text.replace(/^(?:\s*!\[.*?\]\(.*?\)\s*)+$/gm, ' ');
  const paragraphs = text.split(/\n\s*\n/);
  let paragraph = '';
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed || /^[#>]/.test(trimmed)) continue;
    if (trimmed.replace(/\s+/g, '').length < 30) continue;
    paragraph = trimmed;
    break;
  }
  if (!paragraph) return null;
  let plain = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return null;
  if (plain.length > 500) plain = plain.slice(0, 497).trimEnd() + '…';
  return plain;
}

/**
 * Fetches all per-repo endpoints in parallel, normalizes into our
 * cache shape. Any individual call failing drops that field to null
 * rather than failing the whole row — a partial row is still useful.
 */
async function fetchRepoNormalized(nameWithOwner) {
  const [owner, repo] = nameWithOwner.split('/');
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const [core, languages, release, readmeMd, participation] = await Promise.all([
    tryFetch(base),
    tryFetch(`${base}/languages`),
    tryFetch(`${base}/releases/latest`),
    tryFetch(`${base}/readme`, { mediaType: 'application/vnd.github.raw+json' }),
    tryFetch(`${base}/stats/participation`),
  ]);
  if (!core) return null;

  const primaryLanguage = typeof core.language === 'string' ? core.language : null;
  const languageColor = primaryLanguage ? (LANGUAGE_COLORS[primaryLanguage] ?? null) : null;
  const languagesBytes = languages
    ? Object.entries(languages)
        .filter(([, v]) => typeof v === 'number' && v > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([name, bytes]) => ({
          name,
          color: LANGUAGE_COLORS[name] ?? null,
          bytes,
        }))
    : [];
  const topics = Array.isArray(core.topics) ? core.topics.filter((t) => typeof t === 'string') : [];
  const latestRelease =
    release && typeof release.tag_name === 'string' && typeof release.published_at === 'string'
      ? { tag: release.tag_name, publishedAt: release.published_at }
      : null;
  const commitsPerWeek =
    participation && Array.isArray(participation.all) && participation.all.length === 52
      ? participation.all.map((n) => (typeof n === 'number' ? n : 0))
      : null;

  return {
    name: repo,
    nameWithOwner: core.full_name ?? nameWithOwner,
    description: typeof core.description === 'string' ? core.description : null,
    homepage:
      typeof core.homepage === 'string' && core.homepage.trim().length > 0 ? core.homepage : null,
    stars: typeof core.stargazers_count === 'number' ? core.stargazers_count : null,
    forks: typeof core.forks_count === 'number' ? core.forks_count : null,
    primaryLanguage,
    languageColor,
    languagesBytes,
    pushedAt: typeof core.pushed_at === 'string' ? core.pushed_at : null,
    license: core.license?.spdx_id ?? null,
    topics,
    archived: !!core.archived,
    openIssues: typeof core.open_issues_count === 'number' ? core.open_issues_count : null,
    latestRelease,
    readmeExcerpt: extractReadmeExcerpt(readmeMd, repo),
    commitsPerWeek,
    fetchedAt: new Date().toISOString(),
  };
}

async function loadCache() {
  if (!existsSync(CACHE_JSON)) return { fetchedAt: null, repos: {} };
  try {
    const raw = JSON.parse(await readFile(CACHE_JSON, 'utf-8'));
    // Accept either the new shape `{ fetchedAt, repos: {…} }` or the
    // prior shape `{ <slug>: { … } }` so an old cache doesn't force a
    // re-fetch at migration time. Old-shape rows keyed by slug are
    // left behind; the script will warn but keep going.
    if (raw && raw.repos && typeof raw.repos === 'object') return raw;
    if (raw && typeof raw === 'object') {
      console.warn(
        'fetch-projects-github: legacy cache shape detected; ignoring (the next run with network will rewrite it).',
      );
    }
    return { fetchedAt: null, repos: {} };
  } catch (err) {
    console.warn(`fetch-projects-github: WARN unreadable cache — starting fresh: ${err.message}`);
    return { fetchedAt: null, repos: {} };
  }
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  let serialized = JSON.stringify(data, null, 2) + '\n';
  try {
    const prettier = await import('prettier');
    const config = (await prettier.resolveConfig(path)) ?? {};
    serialized = await prettier.format(serialized, { ...config, filepath: path });
  } catch {
    // Prettier missing — JSON.stringify output is still valid.
  }
  await writeFile(path, serialized, 'utf-8');
}

async function writeGeneratedTs(projects) {
  const body = `// AUTO-GENERATED by scripts/fetch-projects-github.mjs - do not hand-edit.
// Re-run via \`npm run fetch:projects\` or as part of \`build:prod\`.
//
// Source-of-truth for the projects surface. The list = union of repos
// opted-in via \`src/app/core/data/projects.overrides.json\` (allowlist
// + optional topic filter) plus any \`manual[]\` entries. Fields are
// populated from the GitHub REST API at build time; missing values
// fall back to the committed cache at \`scripts/cache/projects-github.json\`.

import type { Project } from '@shared/models/project.model';

export const PROJECTS: Readonly<Project[]> = ${JSON.stringify(projects, null, 2)};
`;
  let serialized = body;
  try {
    const prettier = await import('prettier');
    const config = (await prettier.resolveConfig(GENERATED_TS)) ?? {};
    serialized = await prettier.format(body, { ...config, filepath: GENERATED_TS });
  } catch {
    // ignored
  }
  await writeFile(GENERATED_TS, serialized, 'utf-8');
}

/**
 * Merge: apply override row fields on top of GitHub data, de-duping
 * tags with topics. Overrides win for `title`, `description`, `image`;
 * `featured` and `order` come exclusively from overrides (GitHub has
 * no notion of either). Manual entries skip this path.
 */
function mergeRepoRow(cacheRow, override) {
  const name = override?.title ?? cacheRow.name;
  const slug = slugify(name);
  const description =
    override?.description?.trim() ||
    cacheRow.readmeExcerpt ||
    cacheRow.description ||
    'No description available.';
  const image = override?.image ?? '';
  const link = `https://github.com/${cacheRow.nameWithOwner}`;
  const handTags = override?.tags ?? [];
  const topics = cacheRow.topics ?? [];
  const tags = mergeTagsWithTopics(handTags, topics);
  return {
    title: name,
    slug,
    description,
    image,
    link,
    tags,
    featured: !!override?.featured,
    order: typeof override?.order === 'number' ? override.order : undefined,
    github: {
      stars: cacheRow.stars,
      forks: cacheRow.forks,
      primaryLanguage: cacheRow.primaryLanguage,
      languageColor: cacheRow.languageColor,
      pushedAt: cacheRow.pushedAt,
      license: cacheRow.license,
      topics: cacheRow.topics ?? [],
      archived: !!cacheRow.archived,
      openIssues: cacheRow.openIssues,
      homepage: cacheRow.homepage,
      languagesBytes: cacheRow.languagesBytes ?? [],
      latestRelease: cacheRow.latestRelease,
      readmeExcerpt: cacheRow.readmeExcerpt,
      commitsPerWeek: cacheRow.commitsPerWeek,
      fetchedAt: cacheRow.fetchedAt,
    },
  };
}

function mergeTagsWithTopics(tags, topics) {
  const seen = new Set((tags ?? []).map((t) => slugify(t)).filter(Boolean));
  const out = [...(tags ?? [])];
  for (const topic of topics ?? []) {
    const s = slugify(topic);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(topic);
  }
  return out;
}

function sortProjects(projects) {
  // Primary: `order` ascending when set. Secondary: featured first.
  // Tertiary: most-recently-pushed first (manual entries have no
  // pushedAt, they fall to the end).
  return projects.sort((a, b) => {
    const oa = a.order ?? Number.MAX_SAFE_INTEGER;
    const ob = b.order ?? Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    const fa = a.featured ? 1 : 0;
    const fb = b.featured ? 1 : 0;
    if (fa !== fb) return fb - fa;
    const ta = a.github?.pushedAt ? Date.parse(a.github.pushedAt) : 0;
    const tb = b.github?.pushedAt ? Date.parse(b.github.pushedAt) : 0;
    return tb - ta;
  });
}

async function main() {
  const overrides = JSON.parse(await readFile(OVERRIDES_JSON, 'utf-8'));
  const cache = await loadCache();
  const selected = await selectRepos(overrides);

  let fetched = 0;
  let fromCache = 0;
  let missing = 0;
  const freshRepos = { ...cache.repos };

  for (const [key, { nameWithOwner, override }] of selected) {
    const row = await fetchRepoNormalized(nameWithOwner);
    if (row) {
      freshRepos[key] = row;
      fetched++;
    } else if (cache.repos?.[key]) {
      fromCache++;
    } else {
      console.warn(
        `fetch-projects-github: WARN no data for ${nameWithOwner} (network + cache both empty); skipping.`,
      );
      missing++;
      selected.delete(key);
    }
    // Keep override on the entry for the merge step.
    selected.get(key) && (selected.get(key).override = override);
  }

  // Build Project[] from selected repos.
  const fromGithub = [];
  for (const [key, { override }] of selected) {
    const cacheRow = freshRepos[key];
    if (!cacheRow) continue;
    fromGithub.push(mergeRepoRow(cacheRow, override));
  }

  // Manual entries are rendered with no github block.
  const fromManual = (overrides.manual ?? []).map((m) => ({
    title: m.title,
    slug: m.slug ?? slugify(m.title ?? 'manual'),
    description: m.description ?? '',
    image: m.image ?? '',
    link: m.link ?? '',
    tags: m.tags ?? [],
    featured: !!m.featured,
    order: typeof m.order === 'number' ? m.order : undefined,
  }));

  const merged = sortProjects([...fromGithub, ...fromManual]);

  // Strip the `order` field before serialisation; it's a merge-time
  // hint, not a runtime property on `Project`.
  const emitted = merged.map(({ order: _order, ...rest }) => rest);

  await writeJson(CACHE_JSON, {
    fetchedAt: new Date().toISOString(),
    topic: overrides.topic ?? null,
    repos: freshRepos,
  });
  await writeGeneratedTs(emitted);
  await writeJson(GENERATED_JSON, emitted);

  const allEmpty = fetched === 0 && fromCache === 0;
  if (allEmpty && !GITHUB_TOKEN && !existsSync(CACHE_JSON)) {
    console.error(
      'fetch-projects-github: FATAL no GITHUB_TOKEN and no cache — cannot bootstrap an empty list.',
    );
    process.exit(1);
  }

  console.log(
    `fetch-projects-github: selected=${selected.size} fetched=${fetched} from-cache=${fromCache} missing=${missing} manual=${fromManual.length} total=${merged.length}`,
  );
}

await main();
