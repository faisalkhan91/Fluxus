import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { ProjectsComponent } from './projects.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { createMockGithubMeta, createMockProject } from '@testing/project-mocks';
import { Project } from '@shared/models/project.model';

const MOCK_PROJECTS: Project[] = [
  createMockProject({
    title: 'Project Alpha',
    slug: 'project-alpha',
    description: 'Alpha description with details.',
    image: 'assets/alpha.png',
    link: 'https://github.com/alpha',
    tags: ['Angular', 'TypeScript'],
    featured: true,
    github: createMockGithubMeta({
      stars: 1234,
      forks: 5,
      primaryLanguage: 'TypeScript',
      languageColor: '#3178c6',
      pushedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      license: 'MIT',
      topics: ['routing', 'services'],
      openIssues: 2,
      homepage: 'https://example.com/alpha',
      languagesBytes: [
        { name: 'TypeScript', color: '#3178c6', bytes: 8000 },
        { name: 'HTML', color: '#e34c26', bytes: 2000 },
      ],
      latestRelease: { tag: 'v1.2.3', publishedAt: '2026-04-01T00:00:00Z' },
    }),
  }),
  // No `github` block — must render without meta row, stripe, or archived badge.
  createMockProject({
    title: 'Project Beta',
    slug: 'project-beta',
    description: 'Beta description.',
    image: 'assets/beta.png',
    link: 'https://github.com/beta',
    tags: ['Python'],
  }),
];

const mockProjectsData = {
  projects: signal(MOCK_PROJECTS),
};

describe('ProjectsComponent', () => {
  let fixture: ComponentFixture<ProjectsComponent>;
  let component: ProjectsComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [provideRouter([]), { provide: ProjectsDataService, useValue: mockProjectsData }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render project cards', () => {
    const cards = el.querySelectorAll('.project-card');
    expect(cards.length).toBe(2);
  });

  it('should display project titles', () => {
    const titles = el.querySelectorAll('.project-title');
    expect(titles[0].textContent?.trim()).toBe('Project Alpha');
    expect(titles[1].textContent?.trim()).toBe('Project Beta');
  });

  it('should start with all projects collapsed', () => {
    const buttons = el.querySelectorAll('.read-more-toggle');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('should toggle expansion on button click', () => {
    const btn = el.querySelector('.read-more-toggle') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(btn.textContent?.trim()).toContain('Show less');
  });

  it('should collapse on second click', () => {
    const btn = el.querySelector('.read-more-toggle') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.textContent?.trim()).toContain('Read more');
  });

  it('should expand projects independently', () => {
    const buttons = el.querySelectorAll('.read-more-toggle') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('should set aria-controls matching description id', () => {
    const btn = el.querySelector('.read-more-toggle');
    const controlsId = btn?.getAttribute('aria-controls');
    expect(controlsId).toBe('desc-project-alpha');
    const desc = el.querySelector(`#${controlsId}`);
    expect(desc).toBeTruthy();
  });

  it('should render tags', () => {
    const firstCardTags = el.querySelector('.project-card')?.querySelectorAll('.tag');
    expect(firstCardTags?.length).toBe(2);
    expect(firstCardTags?.[0].textContent?.trim()).toBe('Angular');
  });

  it('assigns id="project-<slug>" on each card so #project-... deep-links work', () => {
    const cards = Array.from(el.querySelectorAll('.project-card'));
    const ids = cards.map((card) => card.getAttribute('id'));
    expect(ids).toEqual(['project-project-alpha', 'project-project-beta']);
  });

  it('renders tags as links to the projects archive at /projects/tag/:slug', () => {
    const firstCardTags = el
      .querySelector('.project-card')
      ?.querySelectorAll<HTMLAnchorElement>('a.tag');
    expect(firstCardTags?.length).toBe(2);
    expect(firstCardTags?.[0].getAttribute('href')).toBe('/projects/tag/angular');
    expect(firstCardTags?.[1].getAttribute('href')).toBe('/projects/tag/typescript');
    expect(firstCardTags?.[0].getAttribute('aria-label')).toBe('View all projects tagged Angular');
  });

  it('mounts <ui-github-meta> only on cards with a github block', () => {
    const cards = el.querySelectorAll('.project-card');
    // `<ui-github-meta>` unconditionally mounts (the parent template
    // doesn't guard it), but self-hides when `meta()` is undefined.
    // We assert on the rendered children — the pill row — so both
    // "component exists" and "it rendered nothing for beta" are
    // covered in one pass.
    expect(cards[0].querySelector('.gh-pill-row')).toBeTruthy();
    expect(cards[1].querySelector('.gh-pill-row')).toBeNull();

    const alphaPills = Array.from(
      cards[0].querySelectorAll('.gh-pill') as NodeListOf<HTMLElement>,
    ).map((p) => p.textContent?.trim().replace(/\s+/g, ' ') ?? '');
    // 7 pills on the card (open-issues pill is suppressed here; detail
    // page opts in via [showOpenIssues]): language, release, live-demo,
    // stars, forks, updated, license.
    expect(alphaPills.length).toBe(7);
    const joined = alphaPills.join(' | ');
    expect(joined).toContain('TypeScript');
    expect(joined).toContain('v1.2.3');
    expect(joined).toContain('Live demo');
    expect(joined).toContain('1.2k');
    expect(joined).toContain('5');
    expect(joined).toContain('3d ago');
    expect(joined).toContain('MIT');
  });

  it('renders a Live demo pill linking to the repo homepage when set', () => {
    const alphaCard = el.querySelectorAll('.project-card')[0];
    const demoLink = alphaCard.querySelector('a.gh-pill-link') as HTMLAnchorElement | null;
    expect(demoLink).toBeTruthy();
    expect(demoLink?.getAttribute('href')).toBe('https://example.com/alpha');
    expect(demoLink?.getAttribute('target')).toBe('_blank');
    expect(demoLink?.textContent).toContain('Live demo');
  });

  it('renders a language distribution bar with one segment per languagesBytes entry', () => {
    const bar = el.querySelector('.project-card .gh-languages-bar');
    expect(bar).toBeTruthy();
    const segments = bar?.querySelectorAll('.gh-languages-segment');
    expect(segments?.length).toBe(2);
    expect(bar?.getAttribute('aria-label')).toContain('TypeScript 80.0%');
    expect(bar?.getAttribute('aria-label')).toContain('HTML 20.0%');
  });

  it('hides the language bar on cards with no languagesBytes', () => {
    const betaCard = el.querySelectorAll('.project-card')[1];
    expect(betaCard.querySelector('.gh-languages-bar')).toBeNull();
  });

  it('paints a language-color stripe on cards with a githubColor and hides it otherwise', () => {
    const cards = el.querySelectorAll('.project-card');
    expect(cards[0].querySelector('.project-language-stripe')).toBeTruthy();
    expect(cards[1].querySelector('.project-language-stripe')).toBeNull();
  });

  it('hides the archived badge and .archived class when the repo is live', () => {
    const cards = el.querySelectorAll('.project-card');
    expect(cards[0].classList.contains('archived')).toBe(false);
    expect(cards[0].querySelector('.archived-badge')).toBeNull();
  });

  describe('sort controls', () => {
    it('defaults to Featured (catalog order)', () => {
      expect(el.querySelector('.projects-sort-option.active')?.textContent?.trim()).toBe(
        'Featured',
      );
      const titles = Array.from(
        el.querySelectorAll('.project-title') as NodeListOf<HTMLElement>,
      ).map((t) => t.textContent?.trim());
      expect(titles).toEqual(['Project Alpha', 'Project Beta']);
    });

    it('sorts alphabetically when "A–Z" is selected', async () => {
      const router = TestBed.inject(Router);
      await router.navigate([], { queryParams: { sort: 'alpha' } });
      fixture.detectChanges();
      const titles = Array.from(
        el.querySelectorAll('.project-title') as NodeListOf<HTMLElement>,
      ).map((t) => t.textContent?.trim());
      expect(titles).toEqual(['Project Alpha', 'Project Beta']);
      expect(el.querySelector('.projects-sort-option.active')?.textContent?.trim()).toBe('A–Z');
    });

    it('sorts by stars descending when "Most starred" is selected', async () => {
      const router = TestBed.inject(Router);
      await router.navigate([], { queryParams: { sort: 'stars' } });
      fixture.detectChanges();
      const titles = Array.from(
        el.querySelectorAll('.project-title') as NodeListOf<HTMLElement>,
      ).map((t) => t.textContent?.trim());
      // Alpha has stars=1234, Beta has no github; Alpha must sort first.
      expect(titles[0]).toBe('Project Alpha');
    });

    it('falls back to "featured" for an unknown sort key in the URL', async () => {
      const router = TestBed.inject(Router);
      await router.navigate([], { queryParams: { sort: 'garbage' } });
      fixture.detectChanges();
      expect(el.querySelector('.projects-sort-option.active')?.textContent?.trim()).toBe(
        'Featured',
      );
    });

    it('writes ?sort=alpha to the URL on click and scrubs the param for the Featured default', () => {
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      const alphaBtn = Array.from(
        el.querySelectorAll('.projects-sort-option') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.trim() === 'A–Z');
      alphaBtn!.click();
      expect(navSpy).toHaveBeenLastCalledWith(
        [],
        expect.objectContaining({
          queryParams: { sort: 'alpha' },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        }),
      );

      const featuredBtn = Array.from(
        el.querySelectorAll('.projects-sort-option') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.trim() === 'Featured');
      featuredBtn!.click();
      expect(navSpy).toHaveBeenLastCalledWith(
        [],
        expect.objectContaining({ queryParams: { sort: null } }),
      );

      navSpy.mockRestore();
    });
  });

  describe('view toggle', () => {
    it('defaults to grid view when ?view is absent', () => {
      const activeViewBtn = el.querySelector('.projects-view-option.active');
      expect(activeViewBtn?.getAttribute('aria-label')).toBe('Grid view');
      // Grid renders via `.projects-grid`; no list hero/rows visible.
      expect(el.querySelector('.projects-grid')).toBeTruthy();
      expect(el.querySelector('.projects-list')).toBeNull();
    });

    it('renders list view with featured heroes and "More work" compact rows when ?view=list', async () => {
      const router = TestBed.inject(Router);
      await router.navigate([], { queryParams: { view: 'list' } });
      fixture.detectChanges();

      expect(el.querySelector('.projects-grid')).toBeNull();
      expect(el.querySelector('.projects-list')).toBeTruthy();

      // Alpha is featured; Beta isn't. One hero, one row, one "More work" heading.
      const heroes = el.querySelectorAll('.projects-list-hero');
      const rows = el.querySelectorAll('.projects-list-row');
      expect(heroes.length).toBe(1);
      expect(rows.length).toBe(1);
      expect(heroes[0].querySelector('.projects-list-hero-title')?.textContent).toContain(
        'Project Alpha',
      );
      expect(rows[0].querySelector('.projects-list-row-title')?.textContent).toContain(
        'Project Beta',
      );
      expect(el.querySelector('.projects-list-more-heading')?.textContent?.trim()).toBe(
        'More work',
      );
    });

    it('falls back to grid for an unknown view value in the URL', async () => {
      const router = TestBed.inject(Router);
      await router.navigate([], { queryParams: { view: 'garbage' } });
      fixture.detectChanges();
      expect(el.querySelector('.projects-grid')).toBeTruthy();
      expect(el.querySelector('.projects-list')).toBeNull();
    });

    it('writes ?view=list on list-toggle click and scrubs the param for grid', () => {
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      const listBtn = Array.from(
        el.querySelectorAll('.projects-view-option') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.getAttribute('aria-label') === 'List view');
      listBtn!.click();
      expect(navSpy).toHaveBeenLastCalledWith(
        [],
        expect.objectContaining({
          queryParams: { view: 'list' },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        }),
      );

      const gridBtn = Array.from(
        el.querySelectorAll('.projects-view-option') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.getAttribute('aria-label') === 'Grid view');
      gridBtn!.click();
      expect(navSpy).toHaveBeenLastCalledWith(
        [],
        expect.objectContaining({ queryParams: { view: null } }),
      );

      navSpy.mockRestore();
    });
  });
});
