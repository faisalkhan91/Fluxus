import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BlogPostSeoService } from './blog-post-seo.service';
import { SeoService } from '@core/services/seo.service';
import type { BlogPost } from '@shared/models/blog-post.model';
import { environment } from '@env/environment';

/**
 * BlogPostSeoService delegates to SeoService for the actual DOM writes
 * (already covered by `seo.service.spec.ts`). The unit-of-test here is
 * the cover-URL builder logic and the series-neighbour math — both pure
 * derivations from the post / series inputs. Mocking SeoService isolates
 * those derivations so a regression doesn't get masked by a changed
 * meta-tag implementation.
 */
function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    slug: 'sample-post',
    title: 'Sample Post',
    date: '2025-01-01',
    excerpt: 'Short excerpt for the sample post.',
    tags: ['Angular'],
    readingTime: '3 min',
    ...overrides,
  };
}

describe('BlogPostSeoService', () => {
  let service: BlogPostSeoService;
  const updateDynamicMeta = vi.fn();
  const setLinkRel = vi.fn();
  const removeLinkRel = vi.fn();
  const setRobots = vi.fn();

  beforeEach(() => {
    updateDynamicMeta.mockReset();
    setLinkRel.mockReset();
    removeLinkRel.mockReset();
    setRobots.mockReset();
    TestBed.configureTestingModule({
      providers: [
        BlogPostSeoService,
        {
          provide: SeoService,
          useValue: { updateDynamicMeta, setLinkRel, removeLinkRel, setRobots },
        },
      ],
    });
    service = TestBed.inject(BlogPostSeoService);
  });

  describe('updateMetaTags — cover URL construction', () => {
    it('passes external (http://) covers through verbatim', () => {
      const post = makePost({ cover: 'https://cdn.example.com/img.webp' });
      service.updateMetaTags(post);
      expect(updateDynamicMeta).toHaveBeenCalledTimes(1);
      const args = updateDynamicMeta.mock.calls[0][0];
      expect(args.image).toBe('https://cdn.example.com/img.webp');
    });

    it('passes external (https://) covers through verbatim', () => {
      const post = makePost({ cover: 'http://example.com/img.png' });
      service.updateMetaTags(post);
      const args = updateDynamicMeta.mock.calls[0][0];
      expect(args.image).toBe('http://example.com/img.png');
    });

    it('prefixes the site origin when cover is repo-relative without a leading slash', () => {
      const post = makePost({ cover: 'assets/blog/cover.webp' });
      service.updateMetaTags(post);
      const args = updateDynamicMeta.mock.calls[0][0];
      expect(args.image).toBe(`${environment.siteUrl}/assets/blog/cover.webp`);
    });

    it('does not double-slash when cover has a leading slash', () => {
      const post = makePost({ cover: '/assets/blog/cover.webp' });
      service.updateMetaTags(post);
      const args = updateDynamicMeta.mock.calls[0][0];
      expect(args.image).toBe(`${environment.siteUrl}/assets/blog/cover.webp`);
    });

    it('falls back to the prerendered /og/<slug>.png when no cover is set', () => {
      const post = makePost({ slug: 'no-cover-post', cover: undefined });
      service.updateMetaTags(post);
      const args = updateDynamicMeta.mock.calls[0][0];
      expect(args.image).toBe(`${environment.siteUrl}/og/no-cover-post.png`);
    });

    it('passes the rest of the meta payload through unchanged', () => {
      const post = makePost({
        slug: 'detailed-post',
        title: 'Detailed Post Title',
        excerpt: 'Detailed excerpt.',
      });
      service.updateMetaTags(post);
      const args = updateDynamicMeta.mock.calls[0][0];
      expect(args).toMatchObject({
        title: `Detailed Post Title - ${environment.siteName}`,
        description: 'Detailed excerpt.',
        url: `${environment.siteUrl}/blog/detailed-post`,
        type: 'article',
      });
    });
  });

  describe('updateMetaTags — robots crawler signal', () => {
    /*
      `inject-meta.mjs` sets `noindex,nofollow` on prerendered draft /
      future-dated posts at build time. SPA navigation into the same
      URL after the shell loads bypasses that — the service must
      mirror the predicate and write / clear the robots tag itself
      so crawlers indexing the live SPA see the same signal as
      crawlers fetching the prerendered HTML.
    */
    it('marks drafts as noindex,nofollow', () => {
      service.updateMetaTags(makePost({ draft: true, date: '2025-01-01' }));
      expect(setRobots).toHaveBeenCalledWith('noindex,nofollow');
    });

    it('marks future-dated posts as noindex,nofollow', () => {
      // Date well past today's ISO string — string compare is
      // monotone with the calendar so this is reliable in tests.
      const farFuture = '9999-12-31';
      service.updateMetaTags(makePost({ date: farFuture }));
      expect(setRobots).toHaveBeenCalledWith('noindex,nofollow');
    });

    it('clears the robots tag for published past-dated posts', () => {
      service.updateMetaTags(makePost({ draft: false, date: '2024-01-01' }));
      // Passing null tells SeoService to remove any existing tag —
      // critical because navigating *from* a draft *to* a published
      // post would otherwise inherit the noindex.
      expect(setRobots).toHaveBeenCalledWith(null);
    });
  });

  describe('updateSeriesLinkRels — neighbour math', () => {
    const seriesPosts: BlogPost[] = [
      makePost({ slug: 'series-1', title: 'Part 1' }),
      makePost({ slug: 'series-2', title: 'Part 2' }),
      makePost({ slug: 'series-3', title: 'Part 3' }),
    ];

    it('clears both rels when the slug is empty', () => {
      service.updateSeriesLinkRels('', { posts: seriesPosts, index: 0 });
      expect(removeLinkRel).toHaveBeenCalledWith('prev');
      expect(removeLinkRel).toHaveBeenCalledWith('next');
      expect(setLinkRel).not.toHaveBeenCalled();
    });

    it('clears both rels when the post is a one-off (no series)', () => {
      service.updateSeriesLinkRels('series-1', undefined);
      expect(removeLinkRel).toHaveBeenCalledWith('prev');
      expect(removeLinkRel).toHaveBeenCalledWith('next');
      expect(setLinkRel).not.toHaveBeenCalled();
    });

    it('clears both rels when the series has fewer than two entries', () => {
      service.updateSeriesLinkRels('series-1', {
        posts: [seriesPosts[0]],
        index: 0,
      });
      expect(removeLinkRel).toHaveBeenCalledWith('prev');
      expect(removeLinkRel).toHaveBeenCalledWith('next');
      expect(setLinkRel).not.toHaveBeenCalled();
    });

    it('first post: prev null, next points at series[1]', () => {
      service.updateSeriesLinkRels('series-1', { posts: seriesPosts, index: 0 });
      expect(setLinkRel).toHaveBeenCalledWith('prev', null);
      expect(setLinkRel).toHaveBeenCalledWith('next', `${environment.siteUrl}/blog/series-2`);
    });

    it('middle post: both prev and next point at neighbours', () => {
      service.updateSeriesLinkRels('series-2', { posts: seriesPosts, index: 1 });
      expect(setLinkRel).toHaveBeenCalledWith('prev', `${environment.siteUrl}/blog/series-1`);
      expect(setLinkRel).toHaveBeenCalledWith('next', `${environment.siteUrl}/blog/series-3`);
    });

    it('last post: prev points at series[N-2], next null', () => {
      service.updateSeriesLinkRels('series-3', { posts: seriesPosts, index: 2 });
      expect(setLinkRel).toHaveBeenCalledWith('prev', `${environment.siteUrl}/blog/series-2`);
      expect(setLinkRel).toHaveBeenCalledWith('next', null);
    });
  });

  describe('clearSeriesLinkRels', () => {
    it('removes both prev and next link rels', () => {
      service.clearSeriesLinkRels();
      expect(removeLinkRel).toHaveBeenCalledWith('prev');
      expect(removeLinkRel).toHaveBeenCalledWith('next');
      expect(removeLinkRel).toHaveBeenCalledTimes(2);
    });
  });
});
