import { RenderMode, PrerenderFallback } from '@angular/ssr';
import type { ServerRoute } from '@angular/ssr';
import { slugify } from '@shared/utils/string.utils';
import { routes } from './app.routes';

/**
 * Read + parse `src/assets/blog/posts.json` with a descriptive error
 * surface for the SSG prerender pass.
 *
 * Bare `JSON.parse(raw)` rethrows a generic `SyntaxError: Unexpected
 * token …` that points at the parser internals, not the source file.
 * That made build failures painful to triage when posts.json was
 * malformed (an unclosed quote in a recent commit could halt the
 * entire deploy with no breadcrumb). Wrapping here means a bad file
 * fails fast with both the path and the original parser message.
 */
async function readPostsJson<T>(): Promise<T[]> {
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const path = join(process.cwd(), 'src/assets/blog/posts.json');
  const raw = await readFile(path, 'utf-8');
  try {
    return JSON.parse(raw) as T[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // `cause` preserves the original parse error for downstream
    // logging / SourceMap-Resolver-style stack walking. Without it,
    // ESLint's `preserve-caught-error` flags the rethrow because the
    // parser's structured error data (position, token) is dropped on
    // the floor.
    throw new Error(`Failed to parse ${path}: ${message}`, { cause: err });
  }
}

/**
 * Top-level static (non-parameterized) route paths, derived from the client
 * route table so the prerender list can't silently drift from it — adding a
 * new top-level page to app.routes.ts automatically prerenders it. The
 * parameterized (`:`) and catch-all (`**`) routes have their own ServerRoute
 * entries below. Asserted against the expected set in the spec.
 */
const STATIC_PATHS = (routes[0]?.children ?? [])
  .map((r) => r.path)
  .filter((p): p is string => typeof p === 'string' && p !== '**' && !p.includes(':'));

/**
 * Collect the unique slugified tag set across `items` as prerender params.
 * Shared by the blog-tag and projects-tag routes so the slug-dedup rule
 * lives in one place and the two surfaces can't diverge.
 */
function collectTagParams(items: { tags?: string[] }[]): { tag: string }[] {
  const tags = new Set<string>();
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      const slug = slugify(tag);
      if (slug) tags.add(slug);
    }
  }
  return Array.from(tags).map((tag) => ({ tag }));
}

export const serverRoutes: ServerRoute[] = [
  ...STATIC_PATHS.map((path): ServerRoute => ({ path, renderMode: RenderMode.Prerender })),
  {
    path: 'blog/tag/:tag',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    async getPrerenderParams() {
      const posts = await readPostsJson<{ tags: string[]; draft?: boolean; date: string }>();
      // Drafts and future-dated (scheduled) posts are excluded so we don't
      // prerender (or sitemap) a tag page whose only contributing post isn't
      // publicly listed yet. The catch-all `**` server route below answers
      // 404 for any tag URL that isn't prerendered, so a visitor who guesses
      // a future tag URL pre-publish gets a real 404 instead of an empty
      // shell with mismatched metadata.
      const today = new Date().toISOString().slice(0, 10);
      return collectTagParams(posts.filter((p) => !p.draft && p.date <= today));
    },
  },
  {
    path: 'projects/tag/:tag',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    async getPrerenderParams() {
      // ProjectsDataService is a plain class with no DI dependencies in its
      // constructor (just a `signal()` wrapping a literal array), so we can
      // instantiate it outside Angular's injector to harvest tags at
      // prerender time. If we ever add constructor injection, this needs
      // to switch to either reading a JSON manifest (like blog/tag does)
      // or running inside a TestBed-style harness.
      const { ProjectsDataService } = await import('./core/services/projects-data.service');
      return collectTagParams(new ProjectsDataService().projects());
    },
  },
  {
    path: 'projects/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    async getPrerenderParams() {
      const { ProjectsDataService } = await import('./core/services/projects-data.service');
      const projects = new ProjectsDataService().projects();
      return projects
        .filter((p): p is typeof p & { slug: string } => typeof p.slug === 'string')
        .map((p) => ({ slug: p.slug }));
    },
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    async getPrerenderParams() {
      // Drafts are still prerendered at /blog/<slug> so the author can review
      // the page in production form before publishing — they're just hidden
      // from the listing surfaces and the sitemap/feed.
      const posts = await readPostsJson<{ slug: string }>();
      return posts.map((p) => ({ slug: p.slug }));
    },
  },
  /*
    Catch-all 404. `RenderMode.Prerender` would emit nothing useful here
    (the prerender pass can't enumerate every possible bad URL), so we use
    `RenderMode.Server` instead — the SSR pipeline now renders the
    NotFoundComponent server-side for any unknown URL, returning a real
    HTTP 404 to crawlers and a fully-painted page to users without waiting
    for the SPA shell to boot first.
  */
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
