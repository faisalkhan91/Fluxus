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
      const posts: { tags: string[]; draft?: boolean }[] = JSON.parse(raw);
      const tags = new Set<string>();
      // Drafts are excluded so we don't prerender (or sitemap) tag pages
      // whose only contributing post isn't publicly listed.
      for (const p of posts.filter((p) => !p.draft)) {
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
  { path: '**', renderMode: RenderMode.Prerender },
];
