#!/usr/bin/env node
/**
 * Builds the canonical project list by merging a hand-edited override
 * manifest (`src/app/core/data/projects.overrides.json`) with GitHub
 * repo metadata fetched at build time. Emits three artefacts:
 *
 *   1. `src/app/core/data/projects.generated.ts` — the full `Project[]`
 *      imported by `ProjectsDataService`. Committed.
 *   2. `src/app/core/data/projects.generated.json` — JSON mirror of the
 *      same list for `.mjs` consumers (sitemap, inject-meta, prerender).
 *   3. `scripts/cache/projects-github.json` — normalised GitHub fetch
 *      cache, keyed by `owner/name` lowercased. Offline fallback.
 *
 * Selection model (union):
 *   - Every entry in `overrides.repos[]` (must-include allowlist).
 *   - Every public repo matching the topic filter when present
 *     (`user:<you> topic:<topic> fork:false archived:false`).
 *
 * Plus any `overrides.manual[]` entries are appended as manual
 * projects (no github block).
 *
 * Runs out of band via `.github/workflows/refresh-projects.yml`
 * (daily cron + manual dispatch). Not part of `build:prod`, so the
 * CI build is deterministic and free of network flake.
 *
 * Network layer: one GraphQL query covers the topic search plus
 * every allowlisted repo's full metadata (via aliased
 * `repository(owner, name)` nodes sharing a RepoFields fragment).
 * That collapses 5 REST endpoints × N repos (~40 calls) into a
 * single request with rate-limit cost ~1. The only REST call
 * retained is `/stats/participation` per repo for the sparkline —
 * GraphQL doesn't expose pre-computed weekly buckets.
 *
 * Error semantics: GraphQL fetch wrapped in try/catch. On failure,
 * fall back to the committed cache row per-repo. A cold cache plus
 * a failing network is the only fatal condition.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Octokit } from 'octokit';
import { slugify } from './lib/projects.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OVERRIDES_JSON = join(ROOT, 'src/app/core/data/projects.overrides.json');
const GENERATED_TS = join(ROOT, 'src/app/core/data/projects.generated.ts');
const GENERATED_JSON = join(ROOT, 'src/app/core/data/projects.generated.json');
const CACHE_JSON = join(ROOT, 'scripts/cache/projects-github.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? '';

/**
 * Pre-configured Octokit client. `octokit` bundles `plugin-throttling`
 * and `plugin-retry`; a single `new Octokit()` wires both up against
 * the default constructor. `userAgent` is required by GitHub for
 * unauthenticated requests.
 *
 * Throttle callbacks both return `false` — we never wait out a
 * rate-limit retry window (can be 60+ seconds). The script runs on a
 * schedule; if a given invocation hits the ceiling, we fall through
 * to the committed cache and the next scheduled run rebuilds fresh.
 */
const octokit = new Octokit({
  auth: GITHUB_TOKEN || undefined,
  userAgent: 'fluxus-build-fetch',
  throttle: {
    onRateLimit: () => false,
    onSecondaryRateLimit: () => false,
  },
  retry: {
    // Don't retry client errors — they'll never succeed. 5xx + network
    // errors retry with exponential backoff out of the box.
    doNotRetry: [400, 401, 403, 404, 422],
  },
});

/**
 * Strip markdown syntax from the README and collapse to ~500 chars of
 * plain prose. Deliberately not a full marked + sanitiser pass —
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
 * RepoFields fragment shared by the topic-search result set and every
 * allowlist repository alias. Keeps the mapping to our cache shape
 * straightforward — one fragment, one `repoToCacheRow()` mapper.
 */
const REPO_FIELDS_FRAGMENT = `
  fragment RepoFields on Repository {
    name
    nameWithOwner
    description
    homepageUrl
    pushedAt
    stargazerCount
    forkCount
    isArchived
    openIssues: issues(states: OPEN) { totalCount }
    primaryLanguage { name color }
    languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
      edges { size node { name color } }
    }
    licenseInfo { spdxId }
    repositoryTopics(first: 20) { nodes { topic { name } } }
    latestRelease { tagName publishedAt }
    readme: object(expression: "HEAD:README.md") { ... on Blob { text } }
  }
`;

/**
 * Build one GraphQL query that:
 *   - runs the topic search (returns every repo matching the filter),
 *   - aliases every allowlist entry to `repoN: repository(...)` for
 *     explicit fetch (so repos without the topic still come back),
 *   - reports rateLimit so we can log cost and verify the 5× drop
 *     vs the old REST pipeline.
 *
 * Allowlist names get sanitised into safe alias identifiers
 * (`[A-Za-z_][A-Za-z0-9_]*`) so GraphQL accepts them.
 */
function buildPortfolioQuery(overrides) {
  const user = overrides.user ?? '';
  const topic = overrides.topic ?? '';
  const searchQuery = user && topic ? `user:${user} topic:${topic} fork:false archived:false` : '';
  const allowlist = (overrides.repos ?? []).filter((r) => r?.repo);
  const aliases = allowlist
    .map((entry, idx) => {
      const [owner, name] = entry.repo.split('/');
      return `  repo${idx}: repository(owner: "${owner}", name: "${name}") { ...RepoFields }`;
    })
    .join('\n');
  const searchSection = searchQuery
    ? `  search(query: "${searchQuery}", type: REPOSITORY, first: 50) {
        nodes { ... on Repository { ...RepoFields } }
      }`
    : '';
  return `
    ${REPO_FIELDS_FRAGMENT}
    query Portfolio {
      ${searchSection}
      ${aliases}
      rateLimit { cost remaining resetAt limit }
    }
  `;
}

/**
 * Collect RepoFields nodes from a GraphQL response into a
 * Map<nameWithOwner-lowercased, node>, deduping across `search.nodes`
 * and every `repoN` alias.
 */
function collectRepoNodes(data) {
  const byKey = new Map();
  const addNode = (node) => {
    if (!node?.nameWithOwner) return;
    const key = node.nameWithOwner.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, node);
  };
  for (const node of data?.search?.nodes ?? []) addNode(node);
  for (const field of Object.keys(data ?? {})) {
    if (field.startsWith('repo')) addNode(data[field]);
  }
  return byKey;
}

/**
 * Map a RepoFields GraphQL node onto our normalised cache row shape.
 * Field-for-field equivalent of the prior REST mapper, with
 * `language.color` coming from GitHub's Linguist source of truth
 * (no hardcoded palette).
 */
function repoNodeToCacheRow(node) {
  const primaryLanguage = node.primaryLanguage?.name ?? null;
  const languageColor = node.primaryLanguage?.color ?? null;
  const languagesBytes = (node.languages?.edges ?? []).map((edge) => ({
    name: edge.node?.name ?? '',
    color: edge.node?.color ?? null,
    bytes: typeof edge.size === 'number' ? edge.size : 0,
  }));
  const topics = (node.repositoryTopics?.nodes ?? [])
    .map((n) => n?.topic?.name)
    .filter((t) => typeof t === 'string');
  const latestRelease =
    node.latestRelease?.tagName && node.latestRelease?.publishedAt
      ? { tag: node.latestRelease.tagName, publishedAt: node.latestRelease.publishedAt }
      : null;
  const [, repoName] = (node.nameWithOwner ?? '').split('/');
  return {
    name: node.name ?? repoName ?? '',
    nameWithOwner: node.nameWithOwner,
    description: typeof node.description === 'string' ? node.description : null,
    homepage:
      typeof node.homepageUrl === 'string' && node.homepageUrl.trim().length > 0
        ? node.homepageUrl
        : null,
    stars: typeof node.stargazerCount === 'number' ? node.stargazerCount : null,
    forks: typeof node.forkCount === 'number' ? node.forkCount : null,
    primaryLanguage,
    languageColor,
    languagesBytes,
    pushedAt: typeof node.pushedAt === 'string' ? node.pushedAt : null,
    license: node.licenseInfo?.spdxId ?? null,
    topics,
    archived: !!node.isArchived,
    openIssues: typeof node.openIssues?.totalCount === 'number' ? node.openIssues.totalCount : null,
    latestRelease,
    readmeExcerpt: extractReadmeExcerpt(node.readme?.text, repoName ?? ''),
    // `commitsPerWeek` is filled in by a follow-up REST call — GraphQL
    // doesn't expose the pre-computed weekly buckets.
    commitsPerWeek: null,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch the 52-week participation stats for one repo. GitHub returns
 * HTTP 202 with an empty body while the stats are cold-computing —
 * callers retry within a session. Octokit's retry plugin handles
 * transient 5xx; we wrap in try/catch so a shaped failure falls
 * through to whatever cached `commitsPerWeek` we have.
 */
async function fetchParticipation(owner, repo) {
  try {
    const res = await octokit.rest.repos.getParticipationStats({ owner, repo });
    const all = res.data?.all;
    if (Array.isArray(all) && all.length === 52) {
      return all.map((n) => (typeof n === 'number' ? n : 0));
    }
    return null;
  } catch {
    return null;
  }
}

async function loadCache() {
  if (!existsSync(CACHE_JSON)) return { fetchedAt: null, repos: {} };
  try {
    const raw = JSON.parse(await readFile(CACHE_JSON, 'utf-8'));
    if (raw && raw.repos && typeof raw.repos === 'object') return raw;
    if (raw && typeof raw === 'object') {
      console.warn(
        'fetch-projects-github: legacy cache shape detected; ignoring (the next successful run will rewrite it).',
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
// Re-run via \`npm run fetch:projects\` locally, or via the
// refresh-projects GitHub Actions workflow (cron + manual dispatch).
//
// Source-of-truth for the projects surface. The list = union of repos
// opted-in via \`src/app/core/data/projects.overrides.json\` (allowlist
// + optional topic filter) plus any \`manual[]\` entries. Fields come
// from the GitHub GraphQL API; missing fields fall back to the
// committed cache at \`scripts/cache/projects-github.json\`.

import type { Project } from '@shared/models/project.model';

export const PROJECTS: readonly Project[] = ${JSON.stringify(projects, null, 2)};
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

/**
 * Apply override row fields on top of GitHub data, de-duping tags
 * with topics. Overrides win for `title`, `description`, `image`;
 * `featured` and `order` come exclusively from overrides (GitHub
 * has no notion of either). Manual entries skip this path.
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
  const allowlist = (overrides.repos ?? []).filter((r) => r?.repo);
  const overrideByKey = new Map(allowlist.map((entry) => [entry.repo.toLowerCase(), entry]));

  // Issue the single GraphQL query. On any failure (network, auth,
  // rate-limit exceeded), we proceed with whatever is in the cache —
  // that's the "builds keep working offline" contract.
  //
  // Short-circuit: GitHub's GraphQL endpoint requires authentication
  // (unlike REST which allows 60/hr anonymous). If no token is set,
  // skip the query entirely and rely on the cache. The refresh
  // workflow always supplies `secrets.GITHUB_TOKEN`; local dev needs
  // an explicit `GITHUB_TOKEN` in the environment.
  let nodeMap = new Map();
  if (!GITHUB_TOKEN) {
    console.warn(
      'fetch-projects-github: no GITHUB_TOKEN in environment — skipping GraphQL query, using cache only. Set GITHUB_TOKEN for a fresh fetch.',
    );
  } else {
    try {
      const query = buildPortfolioQuery(overrides);
      const data = await octokit.graphql(query);
      nodeMap = collectRepoNodes(data);
      const rl = data?.rateLimit;
      if (rl) {
        console.log(
          `fetch-projects-github: graphql cost=${rl.cost} remaining=${rl.remaining}/${rl.limit} resetAt=${rl.resetAt}`,
        );
      }
    } catch (err) {
      console.warn(
        `fetch-projects-github: WARN GraphQL request failed (${err.status ?? 'n/a'} ${err.message ?? err}); falling back to cache rows.`,
      );
    }
  }

  // Union set of repo keys: allowlist ∪ topic-search results. Allowlist
  // entries always stay in the final project list (even if GraphQL
  // failed to return them) because their cached row may still resolve.
  const selected = new Map();
  for (const entry of allowlist) {
    const key = entry.repo.toLowerCase();
    selected.set(key, { nameWithOwner: entry.repo, override: entry });
  }
  for (const [key, node] of nodeMap) {
    if (selected.has(key)) continue;
    selected.set(key, {
      nameWithOwner: node.nameWithOwner,
      override: overrideByKey.get(key) ?? null,
    });
  }

  let fetched = 0;
  let fromCache = 0;
  let missing = 0;
  const freshRepos = { ...cache.repos };

  for (const [key, { nameWithOwner }] of selected) {
    const node = nodeMap.get(key);
    if (node) {
      const row = repoNodeToCacheRow(node);
      // Participation stats aren't in GraphQL — tag one REST call onto
      // every repo we have a node for. Empty result (cold cache) falls
      // through to whatever the old cache had.
      const [owner, repo] = nameWithOwner.split('/');
      const commits = await fetchParticipation(owner, repo);
      row.commitsPerWeek = commits ?? cache.repos?.[key]?.commitsPerWeek ?? null;
      freshRepos[key] = row;
      fetched++;
    } else if (cache.repos?.[key]) {
      fromCache++;
    } else {
      console.warn(
        `fetch-projects-github: WARN no data for ${nameWithOwner} (graphql + cache both empty); skipping.`,
      );
      missing++;
      selected.delete(key);
    }
  }

  // Build Project[] from the selected repos.
  const fromGithub = [];
  for (const [key, { override }] of selected) {
    const cacheRow = freshRepos[key];
    if (!cacheRow) continue;
    fromGithub.push(mergeRepoRow(cacheRow, override));
  }

  // Manual entries render with no github block.
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

  // Strip the `order` field before serialisation — it's a merge-time
  // hint, not a runtime property on `Project`.
  const emitted = merged.map(({ order: _order, ...rest }) => rest);

  // Fail loudly if we got nothing — no GraphQL hits, no cache rows, no
  // manual entries — rather than silently overwrite a previously-good
  // generated file with an empty list. The previous guard checked
  // `!existsSync(CACHE_JSON)` *after* writing the cache, so it could
  // never fire (the write had just created the file). Checking
  // `merged.length` before any write covers every "nothing to emit"
  // path: cold cache + no token, cache + allowlist drift, deleted
  // overrides, etc.
  if (merged.length === 0) {
    console.error(
      'fetch-projects-github: FATAL no graphql data, no cache rows, and no manual entries — refusing to overwrite outputs with an empty project list.',
    );
    process.exit(1);
  }

  await writeJson(CACHE_JSON, {
    fetchedAt: new Date().toISOString(),
    topic: overrides.topic ?? null,
    repos: freshRepos,
  });
  await writeGeneratedTs(emitted);
  await writeJson(GENERATED_JSON, emitted);

  console.log(
    `fetch-projects-github: selected=${selected.size} fetched=${fetched} from-cache=${fromCache} missing=${missing} manual=${fromManual.length} total=${merged.length}`,
  );
}

await main();
