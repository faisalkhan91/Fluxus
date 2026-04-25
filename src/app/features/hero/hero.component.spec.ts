import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed, DeferBlockBehavior } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { HeroComponent } from './hero.component';
import { ProfileDataService } from '../../core/services/profile-data.service';
import { BlogService } from '../../core/services/blog.service';

const mockProfile = {
  personalInfo: signal({
    name: 'Test User',
    title: 'Engineer',
    email: 'test@example.com',
    phone: '555-1234',
    website: 'https://example.com',
    location: 'Seattle, WA',
    linkedIn: 'https://linkedin.com/in/test',
    github: 'https://github.com/test',
    avatar: 'assets/images/test.jpg',
    bio: ['Bio.'],
  }),
  socialLinks: signal([
    { platform: 'GitHub', url: 'https://github.com/test', icon: 'github', label: 'GitHub' },
  ]),
};

const mockBlog = {
  latestPosts: signal([
    {
      slug: 'test-post',
      title: 'Test Post',
      date: '2025-01-01',
      excerpt: 'Excerpt',
      tags: [],
      readingTime: '3 min',
    },
  ]),
  loading: signal(false),
  error: signal<string | null>(null),
};

describe('HeroComponent', () => {
  let fixture: ComponentFixture<HeroComponent>;
  let component: HeroComponent;
  let el: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [
        provideRouter([]),
        { provide: ProfileDataService, useValue: mockProfile },
        { provide: BlogService, useValue: mockBlog },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      // Render the @defer main template inline rather than the placeholder so
      // the latest-posts assertions still target the real cards. The block is
      // wrapped in `@defer (hydrate on viewport)` for production, see template.
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(HeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render the user name', () => {
    expect(el.textContent).toContain('Test User');
  });

  it('should navigate to /about on primary CTA', () => {
    component.navigateTo('/about');
    expect(router.navigate).toHaveBeenCalledWith(['/about']);
  });

  it('should navigate to /contact on secondary CTA', () => {
    component.navigateTo('/contact');
    expect(router.navigate).toHaveBeenCalledWith(['/contact']);
  });

  it('should show latest posts section when posts exist', () => {
    const latestSection = el.querySelector('.latest-posts');
    expect(latestSection).toBeTruthy();
  });

  it('shows skeleton placeholders while the blog manifest is loading', () => {
    mockBlog.latestPosts.set([]);
    mockBlog.loading.set(true);
    fixture.detectChanges();
    const skeletons = el.querySelectorAll('.latest-post-card--skeleton');
    expect(skeletons.length).toBe(2);
    // Reset for subsequent tests in the same suite.
    mockBlog.loading.set(false);
  });

  it('always reserves space for the latest-posts block (placeholder or real)', () => {
    // After the @defer wrap, the latest-posts container is rendered either by
    // the @placeholder (skeletons) or by the resolved main template — never
    // missing, which is the point of avoiding pop-in.
    mockBlog.latestPosts.set([]);
    mockBlog.loading.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.latest-posts')).toBeTruthy();
  });

  it('should render social links', () => {
    const links = el.querySelectorAll('.social-link');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('aria-label')).toBe('GitHub');
  });
});
