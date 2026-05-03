import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { ProjectsComponent } from './projects.component';
import { ProjectsDataService } from '@core/services/projects-data.service';

const MOCK_PROJECTS = [
  {
    title: 'Project Alpha',
    description: 'Alpha description with details.',
    image: 'assets/alpha.png',
    link: 'https://github.com/alpha',
    tags: ['Angular', 'TypeScript'],
    featured: true,
    github: {
      stars: 1234,
      forks: 5,
      primaryLanguage: 'TypeScript',
      languageColor: '#3178c6',
      pushedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      license: 'MIT',
      topics: ['routing', 'services'],
      archived: false,
      openIssues: 2,
      homepage: 'https://example.com/alpha',
      languagesBytes: [
        { name: 'TypeScript', color: '#3178c6', bytes: 8000 },
        { name: 'HTML', color: '#e34c26', bytes: 2000 },
      ],
      latestRelease: { tag: 'v1.2.3', publishedAt: '2026-04-01T00:00:00Z' },
      fetchedAt: '2026-05-03T00:00:00Z',
    },
  },
  {
    title: 'Project Beta',
    description: 'Beta description.',
    image: 'assets/beta.png',
    link: 'https://github.com/beta',
    tags: ['Python'],
    // No `github` block — must render without meta row, stripe, or archived badge.
  },
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

  it('renders a GitHub meta row with language, stars, forks, updated, license only when github data is present', () => {
    const cards = el.querySelectorAll('.project-card');
    const alphaMeta = cards[0].querySelector('.project-github-meta');
    const betaMeta = cards[1].querySelector('.project-github-meta');

    expect(alphaMeta).toBeTruthy();
    expect(betaMeta).toBeNull();

    const alphaPills = Array.from(alphaMeta!.querySelectorAll('.gh-pill')).map(
      (el) => el.textContent?.trim().replace(/\s+/g, ' ') ?? '',
    );
    // 7 pills now: language, release tag, live demo, stars, forks,
    // updated, license. Stars use the compactNumber "1.2k" rendering;
    // updated was seeded at 3d ago.
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
    const demoLink = alphaCard.querySelector<HTMLAnchorElement>('a.gh-pill-link');
    expect(demoLink).toBeTruthy();
    expect(demoLink?.getAttribute('href')).toBe('https://example.com/alpha');
    expect(demoLink?.getAttribute('target')).toBe('_blank');
    expect(demoLink?.textContent).toContain('Live demo');
  });

  it('renders a release pill with the tag when latestRelease is present', () => {
    const alphaPills = Array.from(
      el.querySelectorAll('.project-card .project-github-meta .gh-pill') as NodeListOf<HTMLElement>,
    ).map((p) => p.textContent?.trim() ?? '');
    expect(alphaPills.some((t) => t.includes('v1.2.3'))).toBe(true);
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

  describe('compactNumber', () => {
    it('formats values under 1000 verbatim', () => {
      expect(component['compactNumber'](42)).toBe('42');
      expect(component['compactNumber'](999)).toBe('999');
    });

    it('formats 1000-9999 as "X.Yk"', () => {
      expect(component['compactNumber'](1200)).toBe('1.2k');
      expect(component['compactNumber'](9999)).toBe('10.0k');
    });

    it('formats ≥10000 as rounded "Xk"', () => {
      expect(component['compactNumber'](12_345)).toBe('12k');
      expect(component['compactNumber'](1_000_000)).toBe('1000k');
    });

    it('returns empty string for null / undefined so the pill is hidden', () => {
      expect(component['compactNumber'](null)).toBe('');
      expect(component['compactNumber'](undefined)).toBe('');
    });
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

  describe('relativeTime', () => {
    it('returns "today" for timestamps under 24h', () => {
      expect(component['relativeTime'](new Date().toISOString())).toBe('today');
    });

    it('returns "Nd ago" for under-month distances', () => {
      const iso = new Date(Date.now() - 5 * 86_400_000).toISOString();
      expect(component['relativeTime'](iso)).toBe('5d ago');
    });

    it('returns "Nmo ago" for under-year distances', () => {
      const iso = new Date(Date.now() - 120 * 86_400_000).toISOString();
      expect(component['relativeTime'](iso)).toBe('4mo ago');
    });

    it('returns a year string for anything over a year old', () => {
      const iso = '2020-06-15T00:00:00Z';
      expect(component['relativeTime'](iso)).toBe('2020');
    });

    it('returns empty string for missing / unparseable input', () => {
      expect(component['relativeTime'](null)).toBe('');
      expect(component['relativeTime'](undefined)).toBe('');
      expect(component['relativeTime']('not-a-date')).toBe('');
    });
  });
});
