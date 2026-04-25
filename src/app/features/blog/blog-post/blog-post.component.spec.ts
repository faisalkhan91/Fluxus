import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CUSTOM_ELEMENTS_SCHEMA, ErrorHandler, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { BlogPostComponent } from './blog-post.component';
import { BlogService } from '@core/services/blog.service';
import { BlogPost } from '@shared/models/blog-post.model';
import { MOCK_POSTS, flushMarkdown, failMarkdown } from '@testing/blog-mocks';

describe('BlogPostComponent', () => {
  let fixture: ComponentFixture<BlogPostComponent>;
  let component: BlogPostComponent;
  let el: HTMLElement;
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let mockBlog: {
    getAdjacentPosts: ReturnType<typeof vi.fn>;
    getRelatedPosts: ReturnType<typeof vi.fn>;
    getSeries: ReturnType<typeof vi.fn>;
    posts: ReturnType<typeof signal<BlogPost[]>>;
    allPosts: ReturnType<typeof signal<BlogPost[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
  };
  let titleService: Title;
  let metaService: Meta;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ slug: 'second-post' }));

    mockBlog = {
      // Default behavior mirrors the real BlogService walking the date-sorted
      // posts list. Tests can call mockReturnValue() to override per-case.
      getAdjacentPosts: vi.fn((slug: string) => {
        const idx = MOCK_POSTS.findIndex((p) => p.slug === slug);
        if (idx === -1) return {};
        return {
          prev: idx > 0 ? MOCK_POSTS[idx - 1] : undefined,
          next: idx < MOCK_POSTS.length - 1 ? MOCK_POSTS[idx + 1] : undefined,
        };
      }),
      getRelatedPosts: vi.fn(() => []),
      getSeries: vi.fn(() => undefined),
      posts: signal(MOCK_POSTS),
      allPosts: signal(MOCK_POSTS),
      loading: signal(false),
      error: signal<string | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [BlogPostComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        { provide: BlogService, useValue: mockBlog },
        // Keep test output free of synthetic resource error logs.
        { provide: ErrorHandler, useValue: { handleError: () => undefined } },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    httpTesting = TestBed.inject(HttpTestingController);
    vi.spyOn(titleService, 'setTitle');
    vi.spyOn(metaService, 'updateTag');

    fixture = TestBed.createComponent(BlogPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture?.destroy();
    httpTesting.verify();
  });

  async function load(slug: string, body = 'Post content'): Promise<void> {
    await flushMarkdown(httpTesting, slug, body);
    fixture.detectChanges();
  }

  async function fail(slug: string, status = 500): Promise<void> {
    await failMarkdown(httpTesting, slug, status);
    fixture.detectChanges();
  }

  describe('resource loading', () => {
    it('issues a GET for the slug markdown', async () => {
      await load('second-post');
      expect(component).toBeTruthy();
    });

    it('renders the markdown body once the request resolves', async () => {
      await load('second-post');
      expect(component.content()).toContain('<p>Post content</p>');
    });

    it('clears loading after content loads', async () => {
      await load('second-post');
      expect(component.loading()).toBe(false);
    });

    it('clears the rendered body when the slug changes (no stale flash)', async () => {
      await load('second-post', 'First body');
      expect(component.content()).toContain('First body');

      paramMapSubject.next(convertToParamMap({ slug: 'first-post' }));
      fixture.detectChanges();
      // Before the new request resolves, the resource value resets to its
      // default ('') so the content signal is empty — no stale flash.
      expect(component.content()).toBe('');

      await load('first-post', 'Second body');
      expect(component.content()).toContain('Second body');
    });
  });

  describe('metadata & SEO', () => {
    it('sets meta with the matching post', async () => {
      await load('second-post');
      expect(component.meta()?.slug).toBe('second-post');
      expect(component.meta()?.title).toBe('Second Post');
    });

    it('updates page title via Title service', async () => {
      await load('second-post');
      expect(titleService.setTitle).toHaveBeenCalledWith(expect.stringContaining('Second Post'));
    });

    it('updates OG meta tags', async () => {
      await load('second-post');
      expect(metaService.updateTag).toHaveBeenCalledWith(
        expect.objectContaining({ property: 'og:title' }),
      );
      expect(metaService.updateTag).toHaveBeenCalledWith(
        expect.objectContaining({ property: 'og:description', content: 'Second excerpt' }),
      );
    });

    it('reads readingTime straight from the manifest (no body recomputation)', async () => {
      // Render a post whose markdown body is intentionally tiny — the
      // displayed reading time must still match the manifest "5 min" because
      // the build-time sync script is the single source of truth.
      await load('second-post', 'A short body.');
      expect(component.readingTime()).toBe('5 min');
      expect(el.querySelector('.post-reading-time')?.textContent).toContain('5 min');
    });
  });

  describe('rendering', () => {
    it('renders post header when meta is set', async () => {
      await load('second-post');
      expect(el.querySelector('.post-header')).toBeTruthy();
    });

    it('renders the post title as a real <h1> inside .post-header', async () => {
      await load('second-post', '# Second Post\n\nBody copy.');
      const h1 = el.querySelector('.post-header h1.post-title');
      expect(h1).toBeTruthy();
      expect(h1?.textContent?.trim()).toBe('Second Post');
    });

    it('strips the leading # heading from rendered markdown to avoid a duplicate <h1>', async () => {
      await load('second-post', '# Second Post\n\nFirst paragraph.');
      // The .post-header H1 above is the canonical title; the rendered body
      // (.prose) must not also emit an <h1> for the markdown's leading title.
      const proseH1 = el.querySelector('.prose h1');
      expect(proseH1).toBeNull();
      expect(component.content()).toContain('<p>First paragraph.</p>');
      expect(component.content()).not.toMatch(/<h1[\s>]/);
    });

    it('preserves leading sub-headings (## and below) — only `# H1` is stripped', async () => {
      await load('second-post', '## Sub heading\n\nBody.');
      expect(component.content()).toMatch(/<h2[\s>]/);
    });

    it('renders an author card linking to /about (no .post-byline)', async () => {
      await load('second-post');
      const card = el.querySelector('.post-author');
      expect(card).toBeTruthy();
      const avatar = card?.querySelector('.post-author-avatar');
      expect(avatar?.getAttribute('alt')).toContain('Faisal Khan');
      expect(card?.querySelector('.post-author-name a')?.getAttribute('href')).toBe('/about');
      expect(card?.querySelector('.post-author-cta')?.getAttribute('href')).toBe('/about');
      // The old single-line byline must not coexist.
      expect(el.querySelector('.post-byline')).toBeNull();
    });
  });

  describe('navigation', () => {
    it('renders the breadcrumb as Home > Blog > <Post title> with aria-current on the title', async () => {
      await load('second-post');
      const items = el.querySelectorAll('.post-breadcrumb li');
      expect(items.length).toBe(3);
      expect(items[0].textContent?.trim()).toBe('Home');
      expect(items[1].textContent?.trim()).toBe('Blog');
      expect(items[2].textContent?.trim()).toBe('Second Post');
      // aria-current must sit on the trailing item only — the prior bug pinned
      // it to "Blog" while the visitor was actually on a post page.
      expect(items[0].getAttribute('aria-current')).toBeNull();
      expect(items[1].getAttribute('aria-current')).toBeNull();
      expect(items[2].getAttribute('aria-current')).toBe('page');
      // The trailing item must be a non-link span so the current page isn't
      // also a clickable link to itself.
      expect(items[2].querySelector('a')).toBeNull();
      // The "Blog" item is restored to a real link so visitors can navigate up.
      expect(items[1].querySelector('a')?.getAttribute('href')).toBe('/blog');
    });

    it('computes adjacent posts', async () => {
      await load('second-post');
      const adj = component.adjacentPosts();
      expect(adj.prev?.slug).toBe('first-post');
      expect(adj.next?.slug).toBe('third-post');
      expect(component.hasAdjacent()).toBe(true);
    });

    it('hasAdjacent is false when there is no prev/next (single-post list)', async () => {
      // Drain the initial second-post request so the cancellation is silent.
      await load('second-post', 'Initial');
      mockBlog.getAdjacentPosts.mockReturnValue({ prev: undefined, next: undefined });
      // Switching slug forces `meta()` (and thus `adjacentPosts`) to re-evaluate.
      paramMapSubject.next(convertToParamMap({ slug: 'first-post' }));
      fixture.detectChanges();
      await load('first-post');
      expect(component.hasAdjacent()).toBe(false);
    });

    it('omits the footer nav landmark when both prev and next are absent', async () => {
      await load('second-post', 'Initial');
      mockBlog.getAdjacentPosts.mockReturnValue({ prev: undefined, next: undefined });
      paramMapSubject.next(convertToParamMap({ slug: 'first-post' }));
      fixture.detectChanges();
      await load('first-post');
      expect(el.querySelector('.post-footer-nav')).toBeNull();
    });
  });

  describe('error states', () => {
    it('reports "Post not found" for an unknown slug (404)', async () => {
      await load('second-post');
      paramMapSubject.next(convertToParamMap({ slug: 'nonexistent' }));
      fixture.detectChanges();
      await fail('nonexistent', 404);

      expect(component.meta()).toBeUndefined();
      expect(component.error()).toBeTruthy();
    });

    it('sets error on content fetch failure (500)', async () => {
      await fail('second-post', 500);
      expect(component.error()).toBe('Failed to load blog post');
    });

    it('exposes an error state when the markdown request fails', async () => {
      paramMapSubject.next(convertToParamMap({ slug: 'nonexistent' }));
      fixture.detectChanges();
      TestBed.tick();
      // Drain the cancelled in-flight request from the original slug without
      // flushing it (httpResource cancelled it when the URL changed).
      httpTesting.match((req) => req.url === 'assets/blog/posts/second-post.md');
      await fail('nonexistent', 404);

      // The error() signal flips truthy as soon as httpResource delivers the
      // error; the OnPush template re-render lags by one extra microtask in
      // jsdom, so we assert against the component's signal directly.
      const cmp = fixture.componentInstance as unknown as { error: () => string | null };
      expect(cmp.error()).toBe('Failed to load blog post');
    });
  });

  describe('series', () => {
    it('hides the series banner when the post is the only one in its series', async () => {
      await load('second-post', 'Initial');
      mockBlog.getSeries.mockReturnValue({
        series: 'Solo Series',
        index: 0,
        posts: [MOCK_POSTS[0]],
      });
      // Switch slug so the `series()` computed re-evaluates with the new mock.
      paramMapSubject.next(convertToParamMap({ slug: 'first-post' }));
      fixture.detectChanges();
      await load('first-post');
      expect(el.querySelector('.post-series')).toBeNull();
    });

    it('renders the series eyebrow above the title for any post with a series (even solo)', async () => {
      await load('second-post', 'Initial');
      // Solo series: full banner stays hidden, but the eyebrow keeps the
      // series + phase context visible above the title.
      mockBlog.getSeries.mockReturnValue({
        series: 'Solo Series',
        index: 0,
        posts: [MOCK_POSTS[0]],
      });
      mockBlog.posts.set([{ ...MOCK_POSTS[0], series: 'Solo Series', seriesOrder: 1 }]);
      mockBlog.allPosts.set([{ ...MOCK_POSTS[0], series: 'Solo Series', seriesOrder: 1 }]);
      paramMapSubject.next(convertToParamMap({ slug: 'first-post' }));
      fixture.detectChanges();
      await load('first-post', 'Body');
      const eyebrow = el.querySelector('.post-header .post-series-eyebrow');
      expect(eyebrow).toBeTruthy();
      expect(eyebrow?.textContent).toContain('Solo Series');
      expect(eyebrow?.textContent).toContain('Phase 1');
      // The eyebrow is intentionally rendered before the H1 in the source
      // order so screen readers announce the series context before the title.
      const header = el.querySelector('.post-header');
      const children = Array.from(header?.children ?? []);
      const eyebrowIdx = children.findIndex((c) => c.classList.contains('post-series-eyebrow'));
      const titleIdx = children.findIndex((c) => c.classList.contains('post-title'));
      expect(eyebrowIdx).toBeGreaterThanOrEqual(0);
      expect(eyebrowIdx).toBeLessThan(titleIdx);
    });

    it('omits the series eyebrow when the post has no series', async () => {
      await load('second-post', 'Body');
      expect(el.querySelector('.post-series-eyebrow')).toBeNull();
    });

    it('renders the series banner when the series has 2+ posts', async () => {
      await load('second-post', 'Initial');
      mockBlog.getSeries.mockReturnValue({
        series: 'Multi Series',
        index: 0,
        posts: [MOCK_POSTS[0], MOCK_POSTS[1]],
      });
      paramMapSubject.next(convertToParamMap({ slug: 'first-post' }));
      fixture.detectChanges();
      await load('first-post');
      const banner = el.querySelector('.post-series');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('Part 1 of 2');
    });
  });
});
