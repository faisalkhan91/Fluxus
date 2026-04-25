import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BlogComponent } from './blog.component';
import { BlogService } from '../../core/services/blog.service';

const MOCK_POSTS = [
  {
    slug: 'post-one',
    title: 'Post One',
    date: '2025-01-01',
    excerpt: 'First',
    tags: ['angular'],
    readingTime: '3 min',
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
    const tags = el.querySelectorAll('.tag');
    expect(tags.length).toBe(2);
    expect(tags[0].textContent?.trim()).toBe('angular');
    expect(tags[1].textContent?.trim()).toBe('go');
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
