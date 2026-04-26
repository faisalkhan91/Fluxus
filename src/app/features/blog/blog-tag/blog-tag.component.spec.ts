import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { BlogTagComponent } from './blog-tag.component';
import { BlogService } from '@core/services/blog.service';
import { BlogPost } from '@shared/models/blog-post.model';
import { environment } from '@env/environment';

const MOCK_POSTS: BlogPost[] = [
  {
    slug: 'first-post',
    title: 'First Post',
    date: '2025-01-01',
    excerpt: 'First excerpt',
    tags: ['Angular', 'TypeScript'],
    readingTime: '3 min',
  },
  {
    slug: 'second-post',
    title: 'Second Post',
    date: '2025-02-01',
    excerpt: 'Second excerpt',
    tags: ['Go'],
    readingTime: '5 min',
  },
];

describe('BlogTagComponent', () => {
  let fixture: ComponentFixture<BlogTagComponent>;
  let titleService: Title;
  let metaService: Meta;
  let document: Document;
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let mockBlog: {
    posts: ReturnType<typeof signal<BlogPost[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
  };

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ tag: 'angular' }));

    mockBlog = {
      posts: signal(MOCK_POSTS),
      loading: signal(false),
      error: signal<string | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [BlogTagComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        { provide: BlogService, useValue: mockBlog },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    document = TestBed.inject(DOCUMENT);
    vi.spyOn(titleService, 'setTitle');
    vi.spyOn(metaService, 'updateTag');

    fixture = TestBed.createComponent(BlogTagComponent);
    fixture.detectChanges();
  });

  it('updates <title> using the resolved tag label and site name', () => {
    expect(titleService.setTitle).toHaveBeenCalledWith(
      `Posts tagged "Angular" - ${environment.siteName}`,
    );
  });

  it('writes og:title, twitter:title, description, and og:url for the tag page', () => {
    const updateTag = metaService.updateTag as unknown as ReturnType<typeof vi.fn>;
    const tags = updateTag.mock.calls.map((args) => args[0] as Record<string, string>);
    const expectTag = (predicate: (tag: Record<string, string>) => boolean) =>
      expect(tags.some(predicate)).toBe(true);

    expectTag((t) => t['property'] === 'og:title' && t['content'].includes('Angular'));
    expectTag((t) => t['name'] === 'twitter:title' && t['content'].includes('Angular'));
    expectTag((t) => t['name'] === 'description' && t['content'].includes('Angular'));
    expectTag(
      (t) =>
        t['property'] === 'og:url' && t['content'] === `${environment.siteUrl}/blog/tag/angular`,
    );
    expectTag((t) => t['property'] === 'og:type' && t['content'] === 'website');
  });

  it('writes/updates a single canonical link pointing at the tag URL', () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe(`${environment.siteUrl}/blog/tag/angular`);
  });

  it('updates meta + canonical when the route param changes', () => {
    paramMapSubject.next(convertToParamMap({ tag: 'go' }));
    fixture.detectChanges();
    expect(titleService.setTitle).toHaveBeenLastCalledWith(
      `Posts tagged "Go" - ${environment.siteName}`,
    );
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(link?.getAttribute('href')).toBe(`${environment.siteUrl}/blog/tag/go`);
  });

  it('falls back to the slug when no post matches the tag yet', () => {
    paramMapSubject.next(convertToParamMap({ tag: 'unknown-tag' }));
    fixture.detectChanges();
    expect(titleService.setTitle).toHaveBeenLastCalledWith(
      `Posts tagged "unknown-tag" - ${environment.siteName}`,
    );
  });

  it('renders Home > Blog > <Tag> breadcrumb with aria-current on the tag', () => {
    const items = fixture.nativeElement.querySelectorAll('.tag-breadcrumb li');
    expect(items.length).toBe(3);
    expect(items[0].textContent?.trim()).toBe('Home');
    expect(items[1].textContent?.trim()).toBe('Blog');
    expect(items[2].textContent?.trim()).toBe('Angular');
    expect(items[2].getAttribute('aria-current')).toBe('page');
  });
});
