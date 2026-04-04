import { describe, it, expect, beforeEach } from 'vitest';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BlogService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty posts', () => {
    expect(service.posts()).toEqual([]);
  });

  it('should start with null error', () => {
    expect(service.error()).toBeNull();
  });

  it('should load and cache posts', () => {
    service.loadPosts().subscribe();
    const req = httpTesting.expectOne('assets/blog/posts.json');
    req.flush(MOCK_POSTS);

    expect(service.posts()).toEqual(MOCK_POSTS);
  });

  it('should reuse the same observable on subsequent calls', () => {
    const obs1 = service.loadPosts();
    const obs2 = service.loadPosts();
    expect(obs1).toBe(obs2);

    httpTesting.expectOne('assets/blog/posts.json').flush(MOCK_POSTS);
  });

  it('should return latest posts sorted by date descending', () => {
    service.loadPosts().subscribe();
    httpTesting.expectOne('assets/blog/posts.json').flush(MOCK_POSTS);

    const latest = service.latestPosts();
    expect(latest).toHaveLength(2);
    expect(latest[0].slug).toBe('post-two');
    expect(latest[1].slug).toBe('post-three');
  });

  it('should set error on HTTP failure', () => {
    service.loadPosts().subscribe();
    httpTesting
      .expectOne('assets/blog/posts.json')
      .error(new ProgressEvent('error'), { status: 500 });

    expect(service.error()).toBe('Failed to load blog posts');
    expect(service.posts()).toEqual([]);
  });

  it('should return adjacent posts', () => {
    service.loadPosts().subscribe();
    httpTesting.expectOne('assets/blog/posts.json').flush(MOCK_POSTS);

    const adj = service.getAdjacentPosts('post-two');
    expect(adj.prev?.slug).toBe('post-one');
    expect(adj.next?.slug).toBe('post-three');
  });

  it('should return undefined for first post prev and last post next', () => {
    service.loadPosts().subscribe();
    httpTesting.expectOne('assets/blog/posts.json').flush(MOCK_POSTS);

    const first = service.getAdjacentPosts('post-one');
    expect(first.prev).toBeUndefined();
    expect(first.next?.slug).toBe('post-two');

    const last = service.getAdjacentPosts('post-three');
    expect(last.prev?.slug).toBe('post-two');
    expect(last.next).toBeUndefined();
  });
});
