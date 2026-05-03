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

function ghHeaders(mediaType = 'application/vnd.github+json') {
  const headers = {
    Accept: mediaType,
    'User-Agent': USER_AGENT,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

/**
 * Single-shot fetch wrapping the repo endpoint. Returns `null` on any
 * failure; the caller decides whether to fall back to cache.
 */
async function fetchRepo(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: ghHeaders(),
    });
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
 * Fetches the raw README markdown. Returns `null` when the repo has no
 * README or the request fails. The raw-content media type sidesteps
 * the base64 decode step on the json shape.
 */
async function fetchReadme(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: ghHeaders('application/vnd.github.raw+json'),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Fetches the 52-week commit participation stats. GitHub returns 202
 * while computing the stats on a cold cache; we don't retry in the
 * build loop — the next enrichment pass picks up a warm stats object.
 */
async function fetchParticipation(owner, repo) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/stats/participation`,
      { headers: ghHeaders() },
    );
    if (!res.ok) return null;
    // 202 is rendered as JSON `{}` in some runtimes; defend against it.
    const json = await res.json();
    if (!json || !Array.isArray(json.all) || json.all.length !== 52) return null;
    return json.all.map((n) => (typeof n === 'number' ? n : 0));
  } catch {
    return null;
  }
}

/**
 * Strip markdown syntax from a fragment and collapse to a ~500-char
 * plain-text excerpt. Deliberately keeps to lexical heuristics — we
 * do NOT run the README through a full marked + sanitizer pass,
 * because the source is third-party content and the excerpt only
 * needs to read as prose. Dropped: headings, code fences, images,
 * inline code, links (text kept, URL dropped), emphasis markers,
 * blockquote chevrons, list bullets.
 */
function extractReadmeExcerpt(md, repoName) {
  if (typeof md !== 'string' || !md.trim()) return null;
  let text = md;
  // Drop the first H1 if it's just the repo name (common README shape).
  text = text.replace(/^\s*#\s+([^\n]+)\n+/, (m, heading) => {
    return heading.trim().toLowerCase() === repoName.toLowerCase() ? '' : m;
  });
  // Strip code fences + HTML comments + raw html attributes shields.
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  // Drop badge lines (common at README top). Heuristic: a line that
  // consists only of image-links to shields.io / github-actions /
  // codecov. Replace with blanks so we don't land the excerpt on them.
  text = text.replace(/^(?:\s*\[!\[.*?\]\(.*?\)\]\(.*?\)\s*)+$/gm, ' ');
  text = text.replace(/^(?:\s*!\[.*?\]\(.*?\)\s*)+$/gm, ' ');
  // Extract the first paragraph that has >30 non-space chars. Paragraphs
  // are separated by blank lines. Skip anything starting with `#` or `>`
  // so we pick prose over headings / callouts.
  const paragraphs = text.split(/\n\s*\n/);
  let paragraph = '';
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    if (/^[#>]/.test(trimmed)) continue;
    if (trimmed.replace(/\s+/g, '').length < 30) continue;
    paragraph = trimmed;
    break;
  }
  if (!paragraph) return null;
  // Flatten inline markdown.
  let plain = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → label
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // emphasis
    .replace(/^\s*[-*+]\s+/gm, '') // bullets
    .replace(/^>\s?/gm, '') // blockquote chevrons
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return null;
  if (plain.length > 500) {
    plain = plain.slice(0, 497).trimEnd() + '…';
  }
  return plain;
}

/**
 * Map a GitHub repo JSON response to our `GithubMeta` shape. Runs only
 * when the fetch succeeded; `null` return means the response was
 * unexpectedly shaped. README + commit stats are layered on separately
 * because they come from different endpoints.
 */
function toMeta(json, readmeExcerpt, commitsPerWeek) {
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
    readmeExcerpt,
    commitsPerWeek,
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
    const [meta, readmeMd, commits] = await Promise.all([
      fetchRepo(gh.owner, gh.repo),
      fetchReadme(gh.owner, gh.repo),
      fetchParticipation(gh.owner, gh.repo),
    ]);
    if (meta) {
      const readmeExcerpt = extractReadmeExcerpt(readmeMd, gh.repo);
      const shaped = toMeta(meta, readmeExcerpt, commits);
      if (shaped) {
        result[titleSlug] = shaped;
        fetched++;
        continue;
      }
    }
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
