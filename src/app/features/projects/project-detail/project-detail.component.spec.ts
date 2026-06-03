import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ProjectDetailComponent } from './project-detail.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { SkillsDataService } from '@core/services/skills-data.service';
import { BlogService } from '@core/services/blog.service';
import type { Project } from '@shared/models/project.model';
import { environment } from '@env/environment';
import { createMockGithubMeta, createMockProject } from '@testing/project-mocks';

const MOCK_PROJECTS: Project[] = [
  createMockProject({
    title: 'Atlas',
    slug: 'atlas',
    description: 'Short description.',
    image: 'assets/atlas.png',
    link: 'https://github.com/faisalkhan91/atlas',
    tags: ['TypeScript', 'Angular', 'serverless-framework'],
    featured: true,
    github: createMockGithubMeta({
      stars: 120,
      forks: 8,
      primaryLanguage: 'TypeScript',
      languageColor: '#3178c6',
      pushedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      license: 'MIT',
      topics: ['angular', 'serverless-framework'],
      openIssues: 4,
      readmeExcerpt: 'Atlas is a log indexer with a streaming ingest.',
      commitsPerWeek: Array.from({ length: 52 }, (_v, i) => i % 7),
    }),
  }),
  createMockProject({
    title: 'Beacon',
    slug: 'beacon',
    description: 'Plain project without GithubMeta.',
    image: 'assets/beacon.png',
    link: 'https://example.com/beacon',
    tags: ['Python'],
  }),
];

const MOCK_SKILLS = {
  categories: signal([
    {
      title: 'Languages',
      skills: [
        { name: 'TypeScript' },
        { name: 'Angular' },
        { name: 'HTML5', aliases: ['HTML'] },
        { name: 'Python' },
      ],
    },
  ]),
};

const MOCK_BLOG = {
  posts: signal([
    {
      slug: 'typescript-tricks',
      title: 'TypeScript Tricks',
      date: '2026-01-01',
      excerpt: '',
      tags: ['TypeScript'],
      readingTime: '3 min',
    },
    {
      slug: 'angular-signals',
      title: 'Angular Signals',
      date: '2026-02-01',
      excerpt: '',
      tags: ['Angular'],
      readingTime: '5 min',
    },
    {
      slug: 'unrelated',
      title: 'Unrelated',
      date: '2026-03-01',
      excerpt: '',
      tags: ['Rust'],
      readingTime: '1 min',
    },
  ]),
};

describe('ProjectDetailComponent', () => {
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let titleService: Title;
  let metaService: Meta;
  let document: Document;
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({ slug: 'atlas' }));

    await TestBed.configureTestingModule({
      imports: [ProjectDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMapSubject.asObservable() } },
        { provide: ProjectsDataService, useValue: { projects: signal(MOCK_PROJECTS) } },
        { provide: SkillsDataService, useValue: MOCK_SKILLS },
        // The real SkillUsageService consumes the mocked data services above;
        // ProjectDetailComponent delegates skill/related-post resolution to it.
        { provide: BlogService, useValue: MOCK_BLOG },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    document = TestBed.inject(DOCUMENT);
    vi.spyOn(titleService, 'setTitle');
    vi.spyOn(metaService, 'updateTag');

    fixture = TestBed.createComponent(ProjectDetailComponent);
    fixture.detectChanges();
  });

  it('renders the hero block with title, README excerpt, and meta pills', () => {
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Atlas');
    expect(fixture.nativeElement.querySelector('.detail-readme')?.textContent).toContain(
      'log indexer',
    );
    const pills = Array.from(
      fixture.nativeElement.querySelectorAll('.gh-pill-row .gh-pill') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim().replace(/\s+/g, ' '));
    expect(pills.some((t) => t?.includes('TypeScript'))).toBe(true);
    expect(pills.some((t) => t?.includes('120'))).toBe(true); // stars
    expect(pills.some((t) => t?.includes('MIT'))).toBe(true); // license
  });

  it('updates <title> and meta tags when the slug resolves', () => {
    expect(titleService.setTitle).toHaveBeenCalledWith(`Atlas — ${environment.siteName}`);
    const updateTag = metaService.updateTag as unknown as ReturnType<typeof vi.fn>;
    const tags = updateTag.mock.calls.map((args) => args[0] as Record<string, string>);
    expect(tags.some((t) => t['property'] === 'og:type' && t['content'] === 'article')).toBe(true);
    expect(
      tags.some(
        (t) =>
          t['property'] === 'og:url' && t['content'] === `${environment.siteUrl}/projects/atlas`,
      ),
    ).toBe(true);
  });

  it('writes a canonical link to the detail URL', () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(link?.getAttribute('href')).toBe(`${environment.siteUrl}/projects/atlas`);
  });

  it('renders "Skills used" chips that deep-link to /skills#skill-<canonical>', () => {
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-chip-skill') as NodeListOf<HTMLAnchorElement>,
    );
    const labels = chips.map((a) => a.textContent?.trim());
    // Atlas tags include TypeScript + Angular (both skills) + serverless-framework (not a skill).
    expect(labels).toEqual(expect.arrayContaining(['TypeScript', 'Angular']));
    expect(labels).not.toContain('serverless-framework');
    // Each anchor resolves to `/skills` with a `fragment`; Router renders
    // the `href` with the fragment appended, so check both shapes.
    const tsChip = chips.find((c) => c.textContent?.trim() === 'TypeScript');
    expect(tsChip?.getAttribute('href')).toContain('/skills');
    expect(tsChip?.getAttribute('href')).toContain('skill-typescript');
  });

  it('lists related blog posts that share at least one tag with the project', () => {
    const posts = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.detail-related-list li a',
      ) as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(posts).toContain('TypeScript Tricks');
    expect(posts).toContain('Angular Signals');
    expect(posts).not.toContain('Unrelated');
  });

  it('emits a sparkline SVG with a path when commitsPerWeek has activity', () => {
    const svg = fixture.nativeElement.querySelector('.detail-sparkline') as SVGSVGElement | null;
    expect(svg).toBeTruthy();
    const path = svg!.querySelector('path')?.getAttribute('d');
    expect(path).toBeTruthy();
    expect(path?.startsWith('M')).toBe(true);
  });

  it('hides the GitHub-dependent sections when the project has no github meta', () => {
    paramMapSubject.next(convertToParamMap({ slug: 'beacon' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Beacon');
    expect(fixture.nativeElement.querySelector('.detail-readme')).toBeNull();
    expect(fixture.nativeElement.querySelector('.detail-sparkline')).toBeNull();
    expect(fixture.nativeElement.querySelector('.gh-pill-row')).toBeNull();
  });

  it('renders the "project not found" status when the slug does not resolve', () => {
    paramMapSubject.next(convertToParamMap({ slug: 'does-not-exist' }));
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('.detail-status');
    expect(status).toBeTruthy();
    expect(status.textContent).toContain('does-not-exist');
  });

  it('marks the page noindex,nofollow when the slug does not resolve', () => {
    // Bad slug shouldn't compete with the real prerendered project pages
    // in the search index. The route is `dynamicMeta: true` so the static
    // SEO path skips it; without an explicit setRobots here the document
    // ships with no robots tag at all (after SeoService.init() clears
    // any leftover) and the friendly fallback chrome is indexable.
    paramMapSubject.next(convertToParamMap({ slug: 'does-not-exist' }));
    fixture.detectChanges();
    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('noindex,nofollow');
    // And the title should reflect the failure rather than leaking the
    // previous valid project's title.
    expect(
      (titleService.setTitle as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0],
    ).toBe(`Project not found — ${environment.siteName}`);
  });
});
