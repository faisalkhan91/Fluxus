/**
 * Project metadata fetched from the GitHub REST API at build time by
 * `scripts/enrich-projects-github.mjs`. Every field is nullable because
 * the source repo may be private, archived, or unreachable when the
 * build runs — the renderer must degrade cleanly in all three cases.
 */
export interface GithubMeta {
  /** Star count. `null` when the fetch failed. */
  stars: number | null;
  /** Fork count. `null` when the fetch failed. */
  forks: number | null;
  /** Primary language (GitHub's "language" field). */
  primaryLanguage: string | null;
  /** Hex colour matching GitHub's Linguist palette. Paired with language. */
  languageColor: string | null;
  /** ISO-8601 timestamp of the last push to any branch. */
  pushedAt: string | null;
  /** SPDX identifier, e.g. `"MIT"`. */
  license: string | null;
  /** Repo topics, already deduped against `tags` (slug-equal wins to tag). */
  topics: string[];
  /** Whether the repo is archived. */
  archived: boolean;
  /** Open-issues count (PRs included — matches the GH badge semantic). */
  openIssues: number | null;
  /**
   * User-set homepage URL on the repo (GitHub's "Website" field). When
   * present, the detail page + card meta row render a "Live demo ↗"
   * CTA. `null` when the field is blank or not fetched — no CTA shown.
   */
  homepage: string | null;
  /**
   * GitHub Linguist byte distribution for the repo, ordered by size
   * descending. The view derives percentages client-side and renders a
   * stacked horizontal bar. Empty array when the fetch failed or the
   * repo has no detectable code (docs-only, etc.). Colors come from
   * the same Linguist palette inlined in the fetch script.
   */
  languagesBytes: { name: string; color: string | null; bytes: number }[];
  /**
   * Most recent published release, keyed by tag + ISO timestamp. `null`
   * when the repo has no releases — the "vX.Y.Z · N ago" pill hides
   * rather than rendering a pointless zero.
   */
  latestRelease: { tag: string; publishedAt: string } | null;
  /**
   * First substantive paragraph of the README, markdown-stripped to
   * plain text, trimmed to ~500 chars. `null` when the README fetch
   * failed or the repo doesn't have one. Stored as plain text rather
   * than rendered HTML so the detail page can't be tricked by an
   * adversarial README — no marked + sanitizer graph runs on
   * third-party content.
   */
  readmeExcerpt: string | null;
  /**
   * GitHub's `/stats/participation` response — 52 weekly commit
   * counts, oldest first. `null` when the stats endpoint returned
   * 202 (GH was computing) at build time. The detail-page sparkline
   * hides itself when absent. Shared metric: `all` (not `owner`) so
   * we count every contributor.
   */
  commitsPerWeek: number[] | null;
  /** ISO timestamp of when the cache row was written. Diagnostic only. */
  fetchedAt: string;
}

export interface Project {
  title: string;
  /**
   * URL-safe slug derived from `title` via `slugify()` by the
   * `ProjectsDataService` at read time. Optional in the type to keep
   * test fixtures light — the live signal always populates it, so
   * production callers (palette fragment target, upcoming
   * `/projects/:slug` route, GithubMeta merge key) can assume it.
   */
  slug?: string;
  description: string;
  image: string;
  link: string;
  tags: string[];
  featured?: boolean;
  /**
   * Populated by the enrichment merge in `ProjectsDataService`. Absent
   * when the link isn't a `github.com/:owner/:repo` URL or the fetch
   * failed and no cache row exists — in both cases the UI hides the
   * GitHub meta row entirely rather than rendering placeholder dashes.
   */
  github?: GithubMeta;
}
