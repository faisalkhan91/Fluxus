import { describe, it, expect, beforeEach } from 'vitest';
import { ApplicationRef, ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BlogService } from './blog.service';
import { BlogPost } from '../../shared/models/blog-post.model';

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

  async function flushPosts(payload: BlogPost[] = MOCK_POSTS): Promise<void> {
    // The httpResource defers its initial fetch until the first effect run; tick once.
    TestBed.tick();
    httpTesting.expectOne('assets/blog/posts.json').flush(payload);
    await TestBed.inject(ApplicationRef).whenStable();
  }

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
    await flushPosts();

    const slugs = service.posts().map((p) => p.slug);
    expect(slugs).toEqual(['post-two', 'post-three', 'post-one']);
  });

  it('latestPosts returns the first 2 sorted posts', async () => {
    await flushPosts();

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
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.error()).toBe('Failed to load blog posts');
    expect(service.posts()).toEqual([]);
  });

  it('getAdjacentPosts walks the date-sorted list (prev = newer, next = older)', async () => {
    await flushPosts();

    const adj = service.getAdjacentPosts('post-three');
    expect(adj.prev?.slug).toBe('post-two');
    expect(adj.next?.slug).toBe('post-one');
  });

  it('returns undefined for newest post prev and oldest post next', async () => {
    await flushPosts();

    const newest = service.getAdjacentPosts('post-two');
    expect(newest.prev).toBeUndefined();
    expect(newest.next?.slug).toBe('post-three');

    const oldest = service.getAdjacentPosts('post-one');
    expect(oldest.prev?.slug).toBe('post-three');
    expect(oldest.next).toBeUndefined();
  });

  it('returns empty object for unknown slug', async () => {
    await flushPosts();

    expect(service.getAdjacentPosts('nope')).toEqual({});
  });
});
