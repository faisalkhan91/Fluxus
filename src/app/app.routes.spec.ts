import { describe, it, expect } from 'vitest';
import { routes } from './app.routes';

/**
 * `app.routes.server.ts` derives its static prerender list from this same
 * client route table (filtering out parameterized `:` and catch-all `**`
 * routes). This guards the source of truth: if a top-level static page is
 * added or removed, the expected set below must be updated deliberately —
 * which is the moment to confirm it should (not) be prerendered.
 */
describe('static prerender paths', () => {
  it('exposes exactly the expected top-level static pages, in order', () => {
    const staticPaths = (routes[0]?.children ?? [])
      .map((r) => r.path)
      .filter((p): p is string => typeof p === 'string' && p !== '**' && !p.includes(':'));
    expect(staticPaths).toEqual([
      '',
      'about',
      'experience',
      'skills',
      'projects',
      'certifications',
      'contact',
      'blog',
    ]);
  });
});
