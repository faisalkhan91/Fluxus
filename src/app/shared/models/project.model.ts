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
