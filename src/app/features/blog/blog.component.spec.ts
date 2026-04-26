import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BlogComponent } from './blog.component';
import { BlogService } from '@core/services/blog.service';

const MOCK_POSTS = [
  {
    slug: 'post-one',
    title: 'Post One',
    date: '2025-01-01',
    excerpt: 'First',
    tags: ['angular'],
    readingTime: '3 min',
    cover: 'assets/images/blog/cover-one.webp',
  },
  {
    slug: 'post-two',
    title: 'Post Two',
    date: '2025-02-01',
    excerpt: 'Second',
    tags: ['go'],
    readingTime: '5 min',
  },
];

const mockBlog = {
  posts: signal<typeof MOCK_POSTS>(MOCK_POSTS),
  loading: signal(false),
  error: signal<string | null>(null),
};

describe('BlogComponent', () => {
  let fixture: ComponentFixture<BlogComponent>;
  let component: BlogComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockBlog.posts.set(MOCK_POSTS);
    mockBlog.loading.set(false);
    mockBlog.error.set(null);

    await TestBed.configureTestingModule({
      imports: [BlogComponent],
      providers: [provideRouter([]), { provide: BlogService, useValue: mockBlog }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render post cards when posts exist', () => {
    const links = el.querySelectorAll('.post-link');
    expect(links.length).toBe(2);
  });

  it('should display post titles', () => {
    const titles = el.querySelectorAll('.post-title');
    expect(titles[0].textContent?.trim()).toBe('Post One');
    expect(titles[1].textContent?.trim()).toBe('Post Two');
  });

  it('should render tags for each post', () => {
    // Tags inside post cards only (the bottom hint also renders `.tag--link`s
    // for every unique tag across all posts).
    const tags = el.querySelectorAll('.post-card .tag');
    expect(tags.length).toBe(2);
    expect(tags[0].textContent?.trim()).toBe('angular');
    expect(tags[1].textContent?.trim()).toBe('go');
  });

  it('should render a tag-browse hint with one entry per unique tag', () => {
    const hintLinks = el.querySelectorAll('.post-grid-hint .tag--link');
    expect(hintLinks.length).toBe(2);
    expect(hintLinks[0].getAttribute('href')).toBe('/blog/tag/angular');
    expect(hintLinks[1].getAttribute('href')).toBe('/blog/tag/go');
  });

  it('should mark only the first post as featured (no LATEST pseudo-element)', () => {
    const links = el.querySelectorAll('.post-link');
    expect(links[0].classList.contains('post-link--featured')).toBe(true);
    expect(links[1].classList.contains('post-link--featured')).toBe(false);
  });

  it('renders a cover image inside the featured card from the post.cover field', () => {
    // First card: explicit cover wins.
    const cover = el.querySelector('.post-link--featured .post-card-cover img');
    expect(cover).toBeTruthy();
    expect(cover?.getAttribute('src')).toBe('assets/images/blog/cover-one.webp');
    expect(cover?.getAttribute('alt')).toBe('Post One');
    // Falls back to (1200, 630) when not in IMAGE_DIMS — keeps CLS bounded.
    expect(cover?.getAttribute('width')).toBeTruthy();
    expect(cover?.getAttribute('height')).toBeTruthy();
  });

  it('falls back to the build-time OG card when the featured post has no cover', () => {
    mockBlog.posts.set([{ ...MOCK_POSTS[0], cover: undefined }, MOCK_POSTS[1]]);
    fixture.detectChanges();
    const cover = el.querySelector('.post-link--featured .post-card-cover img');
    expect(cover?.getAttribute('src')).toBe('/og/post-one.png');
  });

  it('does not render a cover image inside non-featured cards', () => {
    const nonFeaturedCovers = el.querySelectorAll(
      '.post-link:not(.post-link--featured) .post-card-cover',
    );
    expect(nonFeaturedCovers.length).toBe(0);
  });

  it('should not render grid when posts are empty', () => {
    mockBlog.posts.set([]);
    fixture.detectChanges();
    const grid = el.querySelector('.post-grid');
    expect(grid).toBeNull();
  });

  it('should show a loading state while the resource is in flight', () => {
    mockBlog.posts.set([]);
    mockBlog.loading.set(true);
    fixture.detectChanges();
    const status = el.querySelector('.blog-status');
    expect(status).toBeTruthy();
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.textContent).toContain('Loading');
  });

  it('should show an error state when the posts request fails', () => {
    mockBlog.posts.set([]);
    mockBlog.loading.set(false);
    mockBlog.error.set('Failed to load blog posts');
    fixture.detectChanges();
    const error = el.querySelector('.blog-status--error');
    expect(error).toBeTruthy();
    expect(error?.getAttribute('role')).toBe('alert');
    expect(error?.textContent).toContain('Failed to load blog posts');
  });

  it('should show an empty-state message when no posts and no error', () => {
    mockBlog.posts.set([]);
    fixture.detectChanges();
    const status = el.querySelector('.blog-status');
    expect(status).toBeTruthy();
    expect(status?.textContent).toContain('No posts published');
  });
});
