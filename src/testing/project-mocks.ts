import type { GithubMeta, Project } from '@shared/models/project.model';

/**
 * Factory helpers for Project / GithubMeta test fixtures. Every field
 * gets a sensible default so specs only spell out what they need to
 * assert against — adding a new nullable field to the model no longer
 * means touching every consumer spec.
 *
 * Lives under `src/testing/` next to `blog-mocks.ts`; importable via
 * the `@testing` path alias set up in `tsconfig.spec.json`.
 */

const DEFAULT_GITHUB_META: GithubMeta = {
  stars: 0,
  forks: 0,
  primaryLanguage: null,
  languageColor: null,
  pushedAt: null,
  license: null,
  topics: [],
  archived: false,
  openIssues: null,
  homepage: null,
  languagesBytes: [],
  latestRelease: null,
  readmeExcerpt: null,
  commitsPerWeek: null,
  fetchedAt: '2026-05-03T00:00:00Z',
};

/**
 * Returns a `GithubMeta` with all-null/empty defaults, overridable
 * per field. Nested arrays (`topics`, `languagesBytes`, `commitsPerWeek`)
 * are fresh instances per call so specs can mutate without leaking
 * across tests.
 */
export function createMockGithubMeta(overrides: Partial<GithubMeta> = {}): GithubMeta {
  return {
    ...DEFAULT_GITHUB_META,
    topics: [...DEFAULT_GITHUB_META.topics],
    languagesBytes: [...DEFAULT_GITHUB_META.languagesBytes],
    ...overrides,
  };
}

/**
 * Returns a minimal `Project` (no `github` block by default). Pass a
 * populated `github` via `overrides` — `createMockGithubMeta()` is the
 * natural companion.
 */
export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    title: 'Test Project',
    slug: 'test-project',
    description: 'Test description.',
    image: 'assets/images/portfolio/test.png',
    link: 'https://github.com/test/test',
    tags: [],
    featured: false,
    ...overrides,
  };
}
