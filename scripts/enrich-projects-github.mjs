#!/usr/bin/env node
/**
 * Fetches public metadata (stars, forks, language, topics, last-push,
 * license, archived, open-issues) for every project in
 * `src/app/core/services/projects-data.service.ts` whose `link` points
 * at a GitHub repo, then writes two artefacts:
 *
 *   1. `src/app/core/data/projects.github.generated.ts` — typed TS
 *      module imported by `ProjectsDataService` at runtime. The module
 *      is always well-formed so the app can build even when this
 *      script hasn't been re-run.
 *
 *   2. `scripts/cache/projects-github.json` — disk cache that survives
 *      a rate-limit or offline build. When the fetch fails for any
 *      repo we keep the cached row rather than dropping the data.
 *
 * Network safety:
 *   - Unauthenticated GitHub API calls are limited to 60/hour per IP.
 *     We have <10 projects, so no token is required — but set
 *     `GITHUB_TOKEN` in CI for headroom.
 *   - Any individual repo fetch failing (404, 403, timeout) is logged
 *     and falls back to the cached row. The script never fails the
 *     build; CI that needs strict freshness can grep for "WARN" in
 *     the logs.
 *
 * Run via `npm run enrich:projects` or implicitly through `build:prod`.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEntries } from './lib/projects.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GENERATED_TS = join(ROOT, 'src/app/core/data/projects.github.generated.ts');
const CACHE_JSON = join(ROOT, 'scripts/cache/projects-github.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';
const USER_AGENT = 'fluxus-build-enrichment';

/**
 * Minimal Linguist palette for the languages actually in use across
 * the catalog. Keeping it inline (vs. a 80KB `linguist-languages` dep)
 * is cheap and lets us run under any Node without extra installs.
 * Extend when a new language shows up.
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
  C: '#555555',
  'C++': '#f34b7d',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Dockerfile: '#384d54',
  HCL: '#844FBA',
  Jupyter: '#DA5B0B',
};

/**
 * Pulls `{ owner, repo }` from a GitHub URL, or `null` when the link
 * isn't a repo URL (e.g. a gist, a user profile, a non-GitHub host).
 * Kept permissive on trailing slashes / `.git` suffixes.
 */
function parseGithubLink(link) {
  try {
    const url = new URL(link);
    if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return null;
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length < 2) return null;
    const [owner, repoRaw] = parts;
    if (!owner || !repoRaw) return null;
    const repo = repoRaw.replace(/\.git$/, '');
    return { owner, repo };
  } catch {
    return null;
  }
}

/**
 * Single-shot fetch wrapping the repo endpoint. Returns `null` on any
 * failure; the caller decides whether to fall back to cache.
 */
async function fetchRepo(owner, repo) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': USER_AGENT,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!res.ok) {
      console.warn(
        `enrich-projects-github: WARN GET /repos/${owner}/${repo} → ${res.status} ${res.statusText}`,
      );
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(
      `enrich-projects-github: WARN network failure for ${owner}/${repo}: ${err.message}`,
    );
    return null;
  }
}

/**
 * Map a GitHub repo JSON response to our `GithubMeta` shape. Runs only
 * when the fetch succeeded; `null` return means the response was
 * unexpectedly shaped.
 */
function toMeta(json) {
  if (!json || typeof json !== 'object') return null;
  const primaryLanguage = typeof json.language === 'string' ? json.language : null;
  const languageColor = primaryLanguage ? (LANGUAGE_COLORS[primaryLanguage] ?? null) : null;
  const topics = Array.isArray(json.topics) ? json.topics.filter((t) => typeof t === 'string') : [];
  return {
    stars: typeof json.stargazers_count === 'number' ? json.stargazers_count : null,
    forks: typeof json.forks_count === 'number' ? json.forks_count : null,
    primaryLanguage,
    languageColor,
    pushedAt: typeof json.pushed_at === 'string' ? json.pushed_at : null,
    license: json.license?.spdx_id ?? null,
    topics,
    archived: !!json.archived,
    openIssues: typeof json.open_issues_count === 'number' ? json.open_issues_count : null,
    fetchedAt: new Date().toISOString(),
  };
}

async function loadCache() {
  if (!existsSync(CACHE_JSON)) return {};
  try {
    return JSON.parse(await readFile(CACHE_JSON, 'utf-8'));
  } catch (err) {
    console.warn(`enrich-projects-github: WARN unreadable cache — starting fresh: ${err.message}`);
    return {};
  }
}

async function writeCache(data) {
  await mkdir(dirname(CACHE_JSON), { recursive: true });
  await writeFile(CACHE_JSON, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

async function writeGenerated(data) {
  // Stable key ordering keeps the generated file's diff meaningful
  // across reruns. Serialise as a JSON literal (with 2-space indent)
  // and drop it inside the TS module as a frozen readonly record.
  const ordered = Object.fromEntries(
    Object.keys(data)
      .sort()
      .map((k) => [k, data[k]]),
  );
  const json = JSON.stringify(ordered, null, 2);
  const body = `// AUTO-GENERATED by scripts/enrich-projects-github.mjs - do not hand-edit.
// Re-run via \`npm run enrich:projects\` or as part of \`build:prod\`.
//
// Keyed by the slugified project title (same slug the runtime service
// computes). A missing entry means the enrichment script either couldn't
// find the repo, the fetch failed with no cache fallback, or the cache
// row is stale — the UI hides the GitHub meta row for that project.

import type { GithubMeta } from '@shared/models/project.model';

export const PROJECTS_GITHUB_DATA: Readonly<Record<string, GithubMeta>> = ${json};
`;
  let serialized = body;
  try {
    const prettier = await import('prettier');
    const config = (await prettier.resolveConfig(GENERATED_TS)) ?? {};
    serialized = await prettier.format(body, { ...config, filepath: GENERATED_TS });
  } catch {
    // Prettier missing — leave the hand-formatted body. CI's format:check
    // will catch any drift.
  }
  await writeFile(GENERATED_TS, serialized, 'utf-8');
}

async function main() {
  const entries = await loadProjectEntries();
  const cache = await loadCache();
  const result = { ...cache };

  let fetched = 0;
  let fromCache = 0;
  let skipped = 0;

  for (const { titleSlug, link } of entries) {
    const gh = parseGithubLink(link);
    if (!gh) {
      skipped++;
      continue;
    }
    const meta = await fetchRepo(gh.owner, gh.repo);
    if (meta) {
      const shaped = toMeta(meta);
      if (shaped) {
        result[titleSlug] = shaped;
        fetched++;
        continue;
      }
    }
    // Fetch or shape failed — keep whatever is in cache (may be undefined).
    if (cache[titleSlug]) {
      fromCache++;
    } else {
      console.warn(
        `enrich-projects-github: WARN no cache row for ${titleSlug} (${gh.owner}/${gh.repo}); meta omitted`,
      );
    }
  }

  await writeCache(result);
  await writeGenerated(result);

  console.log(
    `enrich-projects-github: fetched=${fetched} cached=${fromCache} skipped-non-gh=${skipped} total=${entries.length}`,
  );
}

await main();
