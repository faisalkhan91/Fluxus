import { describe, it, expect } from 'vitest';
import { environment } from '@env/environment';
import { blogPostUrl, blogTagUrl, projectUrl, projectTagUrl } from './url.utils';

describe('url builders', () => {
  it('blogPostUrl appends /blog/<slug> to the configured site URL', () => {
    expect(blogPostUrl('hello-world')).toBe(`${environment.siteUrl}/blog/hello-world`);
  });

  it('blogTagUrl appends /blog/tag/<slug>', () => {
    expect(blogTagUrl('typescript')).toBe(`${environment.siteUrl}/blog/tag/typescript`);
  });

  it('projectUrl appends /projects/<slug>', () => {
    expect(projectUrl('atlas')).toBe(`${environment.siteUrl}/projects/atlas`);
  });

  it('projectTagUrl appends /projects/tag/<slug>', () => {
    expect(projectTagUrl('angular')).toBe(`${environment.siteUrl}/projects/tag/angular`);
  });

  it('passes the slug through verbatim (caller responsibility to slugify)', () => {
    // The builders are URL-shape helpers, not slugifiers. Spaces, mixed
    // case, and punctuation are preserved so a misuse fails loud at
    // crawl time rather than producing a quietly-wrong URL.
    expect(blogPostUrl('Bad Slug Here')).toBe(`${environment.siteUrl}/blog/Bad Slug Here`);
  });
});
