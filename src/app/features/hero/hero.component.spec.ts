import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed, DeferBlockBehavior } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { HeroComponent } from './hero.component';
import { ProfileDataService } from '@core/services/profile-data.service';
import { BlogService } from '@core/services/blog.service';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { Project } from '@shared/models/project.model';

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

const MOCK_PROJECTS: Project[] = [
  {
    title: 'Alpha',
    slug: 'alpha',
    description: 'Featured one.',
    image: 'a.png',
    link: '#',
    tags: [],
    featured: true,
    github: {
      stars: 42,
      forks: 0,
      primaryLanguage: 'TypeScript',
      languageColor: '#3178c6',
      pushedAt: '2026-05-01T00:00:00Z',
      license: 'MIT',
      topics: [],
      archived: false,
      openIssues: 0,
      homepage: null,
      languagesBytes: [],
      latestRelease: null,
      readmeExcerpt: null,
      commitsPerWeek: null,
      fetchedAt: '2026-05-01T00:00:00Z',
    },
  },
  {
    title: 'Beta',
    slug: 'beta',
    description: 'Not featured.',
    image: 'b.png',
    link: '#',
    tags: [],
  },
  {
    title: 'Gamma',
    slug: 'gamma',
    description: 'Featured two.',
    image: 'c.png',
    link: '#',
    tags: [],
    featured: true,
  },
];

const mockProjects = {
  projects: signal(MOCK_PROJECTS),
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
        { provide: ProjectsDataService, useValue: mockProjects },
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

  it('surfaces only featured projects, capped at 3, linked to their detail pages', () => {
    const cards = Array.from(
      el.querySelectorAll('.featured-projects .latest-post-card') as NodeListOf<HTMLElement>,
    );
    expect(cards.length).toBe(2); // Alpha + Gamma
    const titles = cards.map((c) => c.querySelector('.latest-post-title')?.textContent?.trim());
    expect(titles).toEqual(['Alpha', 'Gamma']);
    const firstHref = el
      .querySelector('.featured-projects .latest-post-link')
      ?.getAttribute('href');
    expect(firstHref).toBe('/projects/alpha');
  });

  it('hides the featured-projects block entirely when no projects are featured', () => {
    mockProjects.projects.set(MOCK_PROJECTS.map((p) => ({ ...p, featured: false })));
    fixture.detectChanges();
    expect(el.querySelector('.featured-projects')).toBeNull();
    // Reset for subsequent tests.
    mockProjects.projects.set(MOCK_PROJECTS);
  });
});
