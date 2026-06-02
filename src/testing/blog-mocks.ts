import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { HttpTestingController } from '@angular/common/http/testing';
import type { BlogPost } from '@shared/models/blog-post.model';

/**
 * Returns a minimal `BlogPost` with sensible defaults that satisfy the
 * model's required fields. Mirrors `createMockProject` /
 * `createMockGithubMeta` in `project-mocks.ts` — specs only spell out
 * the fields they actually assert against, so a new optional field on
 * the model doesn't require touching every consumer spec.
 *
 * Use this for one-off fixtures where the static `MOCK_POSTS` array
 * doesn't fit; keep `MOCK_POSTS` for callers that want a fixed three-
 * post catalog (blog list rendering, sorting, tag aggregation).
 *
 * The `tags` array is defensively copied per call so specs that mutate
 * the array don't leak across tests — matching the same per-call-fresh
 * pattern createMockGithubMeta uses for its nested arrays.
 */
export function createMockBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  const { tags: tagOverride, ...rest } = overrides;
  return {
    slug: 'test-post',
    title: 'Test Post',
    date: '2026-01-01',
    excerpt: 'Test excerpt',
    tags: tagOverride ? [...tagOverride] : [],
    readingTime: '3 min',
    ...rest,
  };
}

export const MOCK_POSTS: BlogPost[] = [
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

const MOCK_POST_BODY = 'Post content';

export async function flushPosts(
  httpTesting: HttpTestingController,
  posts: BlogPost[] = MOCK_POSTS,
): Promise<void> {
  TestBed.tick();
  httpTesting.expectOne('assets/blog/posts.json').flush(posts);
  await TestBed.inject(ApplicationRef).whenStable();
}

export async function flushMarkdown(
  httpTesting: HttpTestingController,
  slug: string,
  body: string = MOCK_POST_BODY,
): Promise<void> {
  TestBed.tick();
  httpTesting.expectOne(`assets/blog/posts/${slug}.md`).flush(body);
  await TestBed.inject(ApplicationRef).whenStable();
}

export async function failMarkdown(
  httpTesting: HttpTestingController,
  slug: string,
  status = 500,
): Promise<void> {
  TestBed.tick();
  httpTesting
    .expectOne(`assets/blog/posts/${slug}.md`)
    .error(new ProgressEvent('error'), { status });
  await TestBed.inject(ApplicationRef).whenStable();
}
