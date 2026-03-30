import { RenderMode, PrerenderFallback, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'hero', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'experience', renderMode: RenderMode.Prerender },
  { path: 'skills', renderMode: RenderMode.Prerender },
  { path: 'projects', renderMode: RenderMode.Prerender },
  { path: 'certifications', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'blog', renderMode: RenderMode.Prerender },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    async getPrerenderParams() {
      const { readFile } = await import('node:fs/promises');
      const { join } = await import('node:path');
      const raw = await readFile(join(process.cwd(), 'src/assets/blog/posts.json'), 'utf-8');
      const posts: { slug: string }[] = JSON.parse(raw);
      return posts.map(p => ({ slug: p.slug }));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
