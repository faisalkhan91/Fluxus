import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplicationRef, CUSTOM_ELEMENTS_SCHEMA, ErrorHandler, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { BlogPostComponent } from './blog-post.component';
import { BlogService } from '../../../core/services/blog.service';
import { BlogPost } from '../../../shared/models/blog-post.model';

const MOCK_POSTS: BlogPost[] = [
  {
    slug: 'first-post',
    title: 'First Post',
    date: '2025-01-01',
    excerpt: 'First excerpt',
    tags: ['angular'],
    readingTime: '3 min',
  },
  {
    slug: 'second-post',
    title: 'Second Post',
    date: '2025-02-01',
    excerpt: 'Second excerpt',
    tags: ['go'],
    readingTime: '5 min',
  },
  {
    slug: 'third-post',
    title: 'Third Post',
    date: '2025-03-01',
    excerpt: 'Third excerpt',
    tags: ['rust'],
    readingTime: '4 min',
  },
];

describe('BlogPostComponent', () => {
  let fixture: ComponentFixture<BlogPostComponent>;
  let component: BlogPostComponent;
  let el: HTMLElement;
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let mockBlog: {
    getAdjacentPosts: ReturnType<typeof vi.fn>;
    posts: ReturnType<typeof signal<BlogPost[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
  };
  let titleService: Title;
  let metaService: Meta;
  let httpTesting: HttpTestingController;

  async function flushMarkdown(slug: string, body: string): Promise<void> {
    TestBed.tick();
    httpTesting.expectOne(`assets/blog/posts/${slug}.md`).flush(body);
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
  }

  async function failMarkdown(slug: string, status = 500): Promise<void> {
    TestBed.tick();
    httpTesting
      .expectOne(`assets/blog/posts/${slug}.md`)
      .error(new ProgressEvent('error'), { status });
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
  }

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
      posts: signal(MOCK_POSTS),
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

  it('issues a GET for the slug markdown', async () => {
    await flushMarkdown('second-post', 'Post content');
    expect(component).toBeTruthy();
  });

  it('renders the markdown body once the request resolves', async () => {
    await flushMarkdown('second-post', 'Post content');
    expect(component.content()).toContain('<p>Post content</p>');
  });

  it('sets meta with the matching post', async () => {
    await flushMarkdown('second-post', 'Post content');
    expect(component.meta()?.slug).toBe('second-post');
    expect(component.meta()?.title).toBe('Second Post');
  });

  it('clears loading after content loads', async () => {
    await flushMarkdown('second-post', 'Post content');
    expect(component.loading()).toBe(false);
  });

  it('updates page title via Title service', async () => {
    await flushMarkdown('second-post', 'Post content');
    expect(titleService.setTitle).toHaveBeenCalledWith(expect.stringContaining('Second Post'));
  });

  it('updates OG meta tags', async () => {
    await flushMarkdown('second-post', 'Post content');
    expect(metaService.updateTag).toHaveBeenCalledWith(
      expect.objectContaining({ property: 'og:title' }),
    );
    expect(metaService.updateTag).toHaveBeenCalledWith(
      expect.objectContaining({ property: 'og:description', content: 'Second excerpt' }),
    );
  });

  it('reports "Post not found" for an unknown slug (404)', async () => {
    await flushMarkdown('second-post', 'Post content');
    paramMapSubject.next(convertToParamMap({ slug: 'nonexistent' }));
    fixture.detectChanges();
    await failMarkdown('nonexistent', 404);

    expect(component.meta()).toBeUndefined();
    expect(component.error()).toBeTruthy();
  });

  it('sets error on content fetch failure (500)', async () => {
    await failMarkdown('second-post', 500);
    expect(component.error()).toBe('Failed to load blog post');
  });

  it('clears the rendered body when the slug changes (no stale flash)', async () => {
    await flushMarkdown('second-post', 'First body');
    expect(component.content()).toContain('First body');

    paramMapSubject.next(convertToParamMap({ slug: 'first-post' }));
    fixture.detectChanges();
    // Before the new request resolves, the resource value resets to its
    // default ('') so the content signal is empty — no stale flash.
    expect(component.content()).toBe('');

    await flushMarkdown('first-post', 'Second body');
    expect(component.content()).toContain('Second body');
  });

  it('computes adjacent posts', async () => {
    await flushMarkdown('second-post', 'Post content');
    const adj = component.adjacentPosts();
    expect(adj.prev?.slug).toBe('first-post');
    expect(adj.next?.slug).toBe('third-post');
    expect(component.hasAdjacent()).toBe(true);
  });

  it('hasAdjacent is false when there is no prev/next (single-post list)', async () => {
    // Drain the initial second-post request so the cancellation is silent.
    await flushMarkdown('second-post', 'Initial');
    mockBlog.getAdjacentPosts.mockReturnValue({ prev: undefined, next: undefined });
    // Switching slug forces `meta()` (and thus `adjacentPosts`) to re-evaluate.
    paramMapSubject.next(convertToParamMap({ slug: 'first-post' }));
    fixture.detectChanges();
    await flushMarkdown('first-post', 'Post content');
    expect(component.hasAdjacent()).toBe(false);
  });

  it('renders the breadcrumb (Home / Blog / Title)', async () => {
    await flushMarkdown('second-post', 'Post content');
    const items = el.querySelectorAll('.post-breadcrumb li');
    expect(items.length).toBe(3);
    expect(items[0].textContent?.trim()).toBe('Home');
    expect(items[1].textContent?.trim()).toBe('Blog');
    expect(items[2].textContent?.trim()).toBe('Second Post');
    expect(items[2].getAttribute('aria-current')).toBe('page');
  });

  it('renders the slim attribution byline', async () => {
    await flushMarkdown('second-post', 'Post content');
    const byline = el.querySelector('.post-byline');
    expect(byline).toBeTruthy();
    expect(byline?.textContent).toContain('Faisal Khan');
    expect(el.querySelector('.edit-link')).toBeNull();
    expect(el.querySelector('.author-bio')).toBeNull();
  });

  it('renders post header when meta is set', async () => {
    await flushMarkdown('second-post', 'Post content');
    const header = el.querySelector('.post-header');
    expect(header).toBeTruthy();
  });

  it('renders error state when error is set', async () => {
    paramMapSubject.next(convertToParamMap({ slug: 'nonexistent' }));
    fixture.detectChanges();
    TestBed.tick();
    // Drain the cancelled in-flight request from the original slug without
    // flushing it (httpResource cancelled it when the URL changed).
    httpTesting.match((req) => req.url === 'assets/blog/posts/second-post.md');
    await failMarkdown('nonexistent', 404);

    const errorBlock = el.querySelector('.post-error');
    expect(errorBlock).toBeTruthy();
  });

  it('omits the footer nav landmark when both prev and next are absent', async () => {
    await flushMarkdown('second-post', 'Initial');
    mockBlog.getAdjacentPosts.mockReturnValue({ prev: undefined, next: undefined });
    paramMapSubject.next(convertToParamMap({ slug: 'first-post' }));
    fixture.detectChanges();
    await flushMarkdown('first-post', 'Post content');
    expect(el.querySelector('.post-footer-nav')).toBeNull();
  });
});
