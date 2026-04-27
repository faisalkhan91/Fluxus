import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BlogService } from './blog.service';
import { BlogPost } from '@shared/models/blog-post.model';
import { flushPosts } from '@testing/blog-mocks';
import { waitForEffects } from '@testing/signals';

const MOCK_POSTS: BlogPost[] = [
  {
    slug: 'post-one',
    title: 'First Post',
    date: '2025-01-15',
    excerpt: 'Excerpt one',
    tags: ['angular'],
    readingTime: '5 min',
  },
  {
    slug: 'post-two',
    title: 'Second Post',
    date: '2025-03-10',
    excerpt: 'Excerpt two',
    tags: ['typescript'],
    readingTime: '3 min',
  },
  {
    slug: 'post-three',
    title: 'Third Post',
    date: '2025-02-20',
    excerpt: 'Excerpt three',
    tags: ['devops'],
    readingTime: '7 min',
  },
];

describe('BlogService', () => {
  let service: BlogService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Suppress the synthetic resource error logging so test output stays clean.
        { provide: ErrorHandler, useValue: { handleError: () => undefined } },
      ],
    });
    service = TestBed.inject(BlogService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with the default empty value before the resource resolves', () => {
    expect(service.posts()).toEqual([]);
  });

  it('starts with null error', () => {
    expect(service.error()).toBeNull();
  });

  it('loads posts and exposes them sorted by date descending', async () => {
    await flushPosts(httpTesting, MOCK_POSTS);

    const slugs = service.posts().map((p) => p.slug);
    expect(slugs).toEqual(['post-two', 'post-three', 'post-one']);
  });

  it('latestPosts returns the first 2 sorted posts', async () => {
    await flushPosts(httpTesting, MOCK_POSTS);

    const latest = service.latestPosts();
    expect(latest).toHaveLength(2);
    expect(latest[0].slug).toBe('post-two');
    expect(latest[1].slug).toBe('post-three');
  });

  it('exposes the error signal on HTTP failure', async () => {
    TestBed.tick();
    httpTesting
      .expectOne('assets/blog/posts.json')
      .error(new ProgressEvent('error'), { status: 500 });
    await waitForEffects();

    expect(service.error()).toBe('Failed to load blog posts');
    expect(service.posts()).toEqual([]);
  });

  it('getAdjacentPosts walks the date-sorted list (prev = newer, next = older)', async () => {
    await flushPosts(httpTesting, MOCK_POSTS);

    const adj = service.getAdjacentPosts('post-three');
    expect(adj.prev?.slug).toBe('post-two');
    expect(adj.next?.slug).toBe('post-one');
  });

  it('returns undefined for newest post prev and oldest post next', async () => {
    await flushPosts(httpTesting, MOCK_POSTS);

    const newest = service.getAdjacentPosts('post-two');
    expect(newest.prev).toBeUndefined();
    expect(newest.next?.slug).toBe('post-three');

    const oldest = service.getAdjacentPosts('post-one');
    expect(oldest.prev?.slug).toBe('post-three');
    expect(oldest.next).toBeUndefined();
  });

  it('returns empty object for unknown slug', async () => {
    await flushPosts(httpTesting, MOCK_POSTS);

    expect(service.getAdjacentPosts('nope')).toEqual({});
  });
});

describe('BlogService — publish-date gating', () => {
  let service: BlogService;
  let httpTesting: HttpTestingController;

  // Three posts straddling the gate boundary so each branch of the predicate
  // is covered: clearly in the past, exactly today, and clearly in the future.
  const PAST = '2026-04-12';
  const TODAY = '2026-04-26';
  const FUTURE = '2026-04-30';

  const POSTS: BlogPost[] = [
    {
      slug: 'past-post',
      title: 'Past',
      date: PAST,
      excerpt: 'past',
      tags: ['angular'],
      readingTime: '1 min',
    },
    {
      slug: 'today-post',
      title: 'Today',
      date: TODAY,
      excerpt: 'today',
      tags: ['angular'],
      readingTime: '1 min',
    },
    {
      slug: 'future-post',
      title: 'Future',
      date: FUTURE,
      excerpt: 'future',
      tags: ['angular'],
      readingTime: '1 min',
    },
  ];

  beforeEach(() => {
    // Only mock Date, NOT setTimeout / setInterval / queueMicrotask. Angular's
    // `ApplicationRef.whenStable()` (used by `flushPosts`) schedules through
    // the real timer queue; freezing it with the default `useFakeTimers()`
    // hangs the test until the 5 s timeout. `toFake: ['Date']` keeps the
    // calendar-day clock deterministic at TODAY while letting microtasks and
    // setTimeout drain normally. toISOString().slice(0, 10) on this instant
    // returns '2026-04-26'.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ErrorHandler, useValue: { handleError: () => undefined } },
      ],
    });
    service = TestBed.inject(BlogService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hides future-dated posts from posts() until the publish date arrives', async () => {
    await flushPosts(httpTesting, POSTS);

    const slugs = service.posts().map((p) => p.slug);
    // today-post is included (date === today, so date <= today). future-post is hidden.
    expect(slugs).toEqual(['today-post', 'past-post']);
  });

  it('reveals the future post once the system clock crosses the publish date', async () => {
    // Replace the fake clock with the post-publish date and rebuild the
    // TestBed so a fresh BlogService picks up the new "today".
    vi.setSystemTime(new Date(`${FUTURE}T00:00:01Z`));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ErrorHandler, useValue: { handleError: () => undefined } },
      ],
    });
    service = TestBed.inject(BlogService);
    httpTesting = TestBed.inject(HttpTestingController);
    await flushPosts(httpTesting, POSTS);

    const slugs = service.posts().map((p) => p.slug);
    expect(slugs).toEqual(['future-post', 'today-post', 'past-post']);
  });

  it('keeps future-dated posts visible in allPosts() so author tooling can still see them', async () => {
    await flushPosts(httpTesting, POSTS);

    const slugs = service.allPosts().map((p) => p.slug);
    expect(slugs).toEqual(['future-post', 'today-post', 'past-post']);
  });

  it('hides future-dated posts from latestPosts() (consumed by the hero)', async () => {
    await flushPosts(httpTesting, POSTS);

    const latest = service.latestPosts();
    expect(latest.map((p) => p.slug)).toEqual(['today-post', 'past-post']);
  });

  it('omits future-dated posts from getAdjacentPosts() chains', async () => {
    await flushPosts(httpTesting, POSTS);

    // future-post is invisible to the gate, so today-post (newest visible)
    // has no `prev`. past-post (oldest visible) has no `next`.
    const newest = service.getAdjacentPosts('today-post');
    expect(newest.prev).toBeUndefined();
    expect(newest.next?.slug).toBe('past-post');
  });
});
