import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { convertToParamMap } from '@angular/router';
import { BlogPostComponent } from './blog-post.component';
import { BlogService } from '../../../core/services/blog.service';
import { BlogPost } from '../../../shared/models/blog-post.model';

const MOCK_POSTS: BlogPost[] = [
  { slug: 'first-post', title: 'First Post', date: '2025-01-01', excerpt: 'First excerpt', tags: ['angular'], readingTime: '3 min' },
  { slug: 'second-post', title: 'Second Post', date: '2025-02-01', excerpt: 'Second excerpt', tags: ['go'], readingTime: '5 min' },
  { slug: 'third-post', title: 'Third Post', date: '2025-03-01', excerpt: 'Third excerpt', tags: ['rust'], readingTime: '4 min' },
];

describe('BlogPostComponent', () => {
  let fixture: ComponentFixture<BlogPostComponent>;
  let component: BlogPostComponent;
  let el: HTMLElement;
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let mockBlog: {
    loadPosts: ReturnType<typeof vi.fn>;
    getPostContent: ReturnType<typeof vi.fn>;
    getAdjacentPosts: ReturnType<typeof vi.fn>;
    posts: ReturnType<typeof signal<BlogPost[]>>;
  };
  let titleService: Title;
  let metaService: Meta;

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ slug: 'second-post' }));

    mockBlog = {
      loadPosts: vi.fn().mockReturnValue(of(MOCK_POSTS)),
      getPostContent: vi.fn().mockReturnValue(of('<p>Post content</p>')),
      getAdjacentPosts: vi.fn().mockReturnValue({
        prev: MOCK_POSTS[0],
        next: MOCK_POSTS[2],
      }),
      posts: signal(MOCK_POSTS),
    };

    await TestBed.configureTestingModule({
      imports: [BlogPostComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        { provide: BlogService, useValue: mockBlog },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    vi.spyOn(titleService, 'setTitle');
    vi.spyOn(metaService, 'updateTag');

    fixture = TestBed.createComponent(BlogPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should load post content for the slug', () => {
    expect(mockBlog.loadPosts).toHaveBeenCalled();
    expect(mockBlog.getPostContent).toHaveBeenCalledWith('second-post');
  });

  it('should set content signal after loading', () => {
    expect(component.content()).toBe('<p>Post content</p>');
  });

  it('should set meta signal with the matching post', () => {
    expect(component.meta()?.slug).toBe('second-post');
    expect(component.meta()?.title).toBe('Second Post');
  });

  it('should clear loading after content loads', () => {
    expect(component.loading()).toBe(false);
  });

  it('should update page title via Title service', () => {
    expect(titleService.setTitle).toHaveBeenCalledWith(
      expect.stringContaining('Second Post'),
    );
  });

  it('should update OG meta tags', () => {
    expect(metaService.updateTag).toHaveBeenCalledWith(
      expect.objectContaining({ property: 'og:title' }),
    );
    expect(metaService.updateTag).toHaveBeenCalledWith(
      expect.objectContaining({ property: 'og:description', content: 'Second excerpt' }),
    );
  });

  it('should set error for missing slug', () => {
    mockBlog.loadPosts.mockReturnValue(of(MOCK_POSTS));
    mockBlog.getPostContent.mockClear();
    paramMapSubject.next(convertToParamMap({ slug: 'nonexistent' }));
    fixture.detectChanges();

    expect(component.error()).toBe('Post not found');
    expect(mockBlog.getPostContent).not.toHaveBeenCalled();
  });

  it('should set error on content fetch failure', () => {
    mockBlog.getPostContent.mockReturnValue(throwError(() => new Error('fail')));
    paramMapSubject.next(convertToParamMap({ slug: 'second-post' }));

    expect(component.error()).toBeTruthy();
  });

  it('should compute adjacent posts', () => {
    const adj = component.adjacentPosts();
    expect(adj.prev?.slug).toBe('first-post');
    expect(adj.next?.slug).toBe('third-post');
  });

  it('should render back link to /blog', () => {
    const backLink = el.querySelector('.back-link');
    expect(backLink).toBeTruthy();
    expect(backLink?.textContent).toContain('All Posts');
  });

  it('should render post header when meta is set', () => {
    const header = el.querySelector('.post-header');
    expect(header).toBeTruthy();
  });

  it('should render error state when error is set', () => {
    mockBlog.loadPosts.mockReturnValue(of(MOCK_POSTS));
    paramMapSubject.next(convertToParamMap({ slug: 'nonexistent' }));
    fixture.detectChanges();
    const errorBlock = el.querySelector('.post-error');
    expect(errorBlock).toBeTruthy();
  });
});
