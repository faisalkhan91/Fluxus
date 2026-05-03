import { RenderMode, PrerenderFallback, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'experience', renderMode: RenderMode.Prerender },
  { path: 'skills', renderMode: RenderMode.Prerender },
  { path: 'projects', renderMode: RenderMode.Prerender },
  { path: 'certifications', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'blog', renderMode: RenderMode.Prerender },
  {
    path: 'blog/tag/:tag',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    async getPrerenderParams() {
      const { readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const raw = await readFile(join(process.cwd(), 'src/assets/blog/posts.json'), 'utf-8');
      const posts: { tags: string[]; draft?: boolean; date: string }[] = JSON.parse(raw);
      const tags = new Set<string>();
      // Drafts and future-dated (scheduled) posts are excluded so we don't
      // prerender (or sitemap) a tag page whose only contributing post isn't
      // publicly listed yet. The catch-all `**` server route below answers
      // 404 for any tag URL that isn't prerendered, so a visitor who guesses
      // a future tag URL pre-publish gets a real 404 instead of an empty
      // shell with mismatched metadata.
      const today = new Date().toISOString().slice(0, 10);
      for (const p of posts.filter((p) => !p.draft && p.date <= today)) {
        for (const tag of p.tags ?? []) {
          const slug = tag
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
          if (slug) tags.add(slug);
        }
      }
      return Array.from(tags).map((tag) => ({ tag }));
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
      const projects = new ProjectsDataService().projects();
      const tags = new Set<string>();
      for (const p of projects) {
        for (const tag of p.tags ?? []) {
          const slug = tag
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
          if (slug) tags.add(slug);
        }
      }
      return Array.from(tags).map((tag) => ({ tag }));
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
        .filter((p) => !!p.slug)
        .map((p) => ({ slug: p.slug as string }));
    },
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    async getPrerenderParams() {
      const { readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const raw = await readFile(join(process.cwd(), 'src/assets/blog/posts.json'), 'utf-8');
      // Drafts are still prerendered at /blog/<slug> so the author can review
      // the page in production form before publishing — they're just hidden
      // from the listing surfaces and the sitemap/feed.
      const posts: { slug: string }[] = JSON.parse(raw);
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
