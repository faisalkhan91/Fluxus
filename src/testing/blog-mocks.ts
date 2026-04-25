import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { BlogPost } from '@shared/models/blog-post.model';

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

export const MOCK_POST_BODY = 'Post content';

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
