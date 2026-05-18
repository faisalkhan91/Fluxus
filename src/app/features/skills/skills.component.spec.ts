import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SkillsComponent } from './skills.component';
import { SkillsDataService } from '@core/services/skills-data.service';
import { SkillUsageService } from '@core/services/skill-usage.service';
import type { SkillUsage } from '@core/services/skill-usage.service';
import { MediaQueryService } from '@core/services/media-query.service';
import type { SkillCategory, Skill } from '@shared/models/skill.model';

/**
 * Six mock categories that roughly mirror production. Each category's
 * lead skill carries a `tagline` because `coreSkills()` now filters on
 * `tagline !== undefined` — that's the narrative-curation signal for
 * the feature strip. The red core-accent border on grid tiles still
 * fires off the separate `tier: 'core'` override.
 */
const MOCK_CATEGORIES: SkillCategory[] = [
  {
    title: 'Languages & Frameworks',
    skills: [
      {
        name: 'Python',
        iconSrc: 'assets/icons/python.svg',
        tier: 'core',
        tagline: 'Primary backend language.',
        since: 2012,
      },
      { name: 'Go', iconSrc: 'assets/icons/go.svg', tier: 'core' },
      { name: 'TypeScript', iconSrc: 'assets/icons/typescript.svg' },
      { name: 'Rust', iconSrc: 'assets/icons/rust.svg' },
      { name: 'Angular', iconSrc: 'assets/icons/angular.svg' },
      { name: 'JavaScript', iconSrc: 'assets/icons/javascript.svg' },
      { name: 'Django', iconSrc: 'assets/icons/django.svg' },
    ],
  },
  {
    title: 'Cloud & Infrastructure',
    skills: [
      {
        name: 'AWS',
        iconSrc: 'assets/icons/aws.svg',
        tier: 'core',
        tagline: 'Day-to-day cloud.',
        since: 2015,
      },
      { name: 'Docker', iconSrc: 'assets/icons/docker.svg', tier: 'core' },
    ],
  },
  {
    title: 'CI/CD & DevOps',
    skills: [
      {
        name: 'GitHub Actions',
        iconSrc: 'assets/icons/github.svg',
        tier: 'core',
        tagline: 'Default CI runtime.',
        since: 2020,
      },
      { name: 'ArgoCD', iconSrc: 'assets/icons/argocd.svg' },
      { name: 'Git', iconSrc: 'assets/icons/git.svg', tier: 'core' },
    ],
  },
  {
    title: 'Data & Storage',
    skills: [
      {
        name: 'PostgreSQL',
        iconSrc: 'assets/icons/postgresql.svg',
        tier: 'core',
        tagline: 'Default relational store.',
        since: 2013,
      },
      { name: 'Kafka', iconSrc: 'assets/icons/kafka.svg' },
    ],
  },
  {
    title: 'Observability',
    skills: [
      {
        name: 'Datadog',
        iconSrc: 'assets/icons/datadog.svg',
        tier: 'core',
        tagline: 'APM, logs, metrics.',
        since: 2018,
      },
    ],
  },
  {
    title: 'AI & LLMs',
    skills: [
      {
        name: 'Claude Code',
        iconSrc: 'assets/icons/anthropic.svg',
        tier: 'core',
        tagline: 'Daily driver for agentic coding.',
        since: 2024,
      },
      { name: 'OpenAI', iconSrc: 'assets/icons/openai.svg' },
      { name: 'GitHub Copilot', iconSrc: 'assets/icons/copilot.svg' },
      { name: 'Gemini', iconSrc: 'assets/icons/gemini.svg' },
      { name: 'Cursor', iconSrc: 'assets/icons/cursor.svg' },
      { name: 'AWS Bedrock', iconSrc: 'assets/icons/aws.svg' },
    ],
  },
];

const mockSkillsData = {
  categories: signal(MOCK_CATEGORIES),
};

function mockUsageFor(skill: Skill): SkillUsage {
  const slug = skill.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return {
    slug,
    projects: [{ title: `${skill.name} Project`, description: '', image: '', link: '#', tags: [] }],
    posts: [],
    projectsRouteSlug: slug,
    postsRouteSlug: null,
  };
}

const mockSkillUsage: Pick<SkillUsageService, 'usageFor' | 'usageBySlug'> = {
  usageFor: mockUsageFor,
  usageBySlug: computed(() => ({})),
};

function createMockMediaQuery(mobile = false) {
  return {
    isMobile: signal(mobile),
    isDesktop: signal(!mobile),
    breakpoint: signal(mobile ? 'mobile' : 'wide'),
    isTablet: signal(false),
    showSidebar: signal(!mobile),
    sidebarCollapsed: signal(false),
    showMobileNav: signal(mobile),
  };
}

describe('SkillsComponent', () => {
  let fixture: ComponentFixture<SkillsComponent>;
  let component: SkillsComponent;
  let el: HTMLElement;

  describe('desktop layout', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SkillsComponent],
        providers: [
          provideRouter([]),
          { provide: SkillsDataService, useValue: mockSkillsData },
          { provide: SkillUsageService, useValue: mockSkillUsage },
          { provide: MediaQueryService, useValue: createMockMediaQuery(false) },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      fixture = TestBed.createComponent(SkillsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      el = fixture.nativeElement;
    });

    it('creates', () => {
      expect(component).toBeTruthy();
    });

    it('renders the single-line intro', () => {
      expect(el.querySelector('.skills-intro')?.textContent).toContain(
        'Tools I reach for day-to-day',
      );
    });

    it('renders the icon-only view toggle next to the H1, list-first', () => {
      // Matches the Projects page toggle (`list` leads) so the two
      // pages present the same control visually and semantically.
      const buttons = el.querySelectorAll('.skills-view-option');
      expect(buttons.length).toBe(2);
      expect(buttons[0].getAttribute('aria-label')).toBe('List view');
      expect(buttons[1].getAttribute('aria-label')).toBe('Grid view');
    });

    it('renders the six tagline-carrying leads in catalog order', () => {
      // Strip membership is `tagline !== undefined`, so we get exactly the
      // category leads that have been curated with a tagline (one per
      // category in the mock). Skills that are `tier: 'core'` without a
      // tagline (Go, Docker, Git) still get the red core-accent border in
      // the grid — they just aren't in the strip.
      const cards = el.querySelectorAll('app-skill-feature-card');
      expect(cards.length).toBe(6);
      const ids = Array.from(cards).map((c) => c.getAttribute('id'));
      expect(ids).toEqual([
        'skill-python',
        'skill-aws',
        'skill-github-actions',
        'skill-postgresql',
        'skill-datadog',
        'skill-claude-code',
      ]);
    });

    it('renders all 6 category sections', () => {
      const sections = el.querySelectorAll('.skill-section');
      expect(sections.length).toBe(6);
    });

    it('sets aria-labelledby with slugified title', () => {
      const section = el.querySelector('.skill-section');
      expect(section?.getAttribute('aria-labelledby')).toBe('skill-languages-frameworks');
    });

    it('shows the first 5 skills per category on desktop', () => {
      const grids = el.querySelectorAll('.skill-grid');
      // Languages: 7 skills → 5 visible
      expect(grids[0].querySelectorAll('ui-skill-badge').length).toBe(5);
      // Cloud: 2 skills → 2 visible
      expect(grids[1].querySelectorAll('ui-skill-badge').length).toBe(2);
      // Observability: 1 skill → 1 visible
      expect(grids[4].querySelectorAll('ui-skill-badge').length).toBe(1);
      // AI & LLMs: 6 skills → 5 visible (1 hidden)
      expect(grids[5].querySelectorAll('ui-skill-badge').length).toBe(5);
    });

    it('shows expand toggles only when the grid overflows', () => {
      const toggles = el.querySelectorAll('.expand-toggle');
      // Languages (7 → 5, 2 more) and AI & LLMs (6 → 5, 1 more) overflow.
      expect(toggles.length).toBe(2);
      expect(toggles[0].textContent?.trim()).toContain('+ 2 more');
      expect(toggles[1].textContent?.trim()).toContain('+ 1 more');
    });

    it('expands to all skills when the toggle is clicked', () => {
      const toggle = el.querySelector('.expand-toggle') as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      const firstGrid = el.querySelectorAll('.skill-grid')[0];
      expect(firstGrid.querySelectorAll('ui-skill-badge').length).toBe(7);
      expect(toggle.textContent?.trim()).toBe('Show less');
    });

    it('collapses back on a second click', () => {
      const toggle = el.querySelector('.expand-toggle') as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      toggle.click();
      fixture.detectChanges();
      const firstGrid = el.querySelectorAll('.skill-grid')[0];
      expect(firstGrid.querySelectorAll('ui-skill-badge').length).toBe(5);
    });

    it('sets aria-expanded on the toggle button', () => {
      const toggle = el.querySelector('.expand-toggle') as HTMLButtonElement;
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      toggle.click();
      fixture.detectChanges();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('resolves /projects/tag/<slug> href via the SkillUsageService mock', () => {
      const skill = MOCK_CATEGORIES[0].skills[0]; // Python
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = component as unknown as any;
      const usage = c.usageFor(skill);
      expect(c.projectsHref(usage)).toBe('/projects/tag/python');
    });

    it('returns undefined for projectsHref when usage is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = component as unknown as any;
      expect(c.projectsHref(undefined)).toBeUndefined();
      expect(c.postsHref(undefined)).toBeUndefined();
    });

    it('renders per-skill anchor ids for deep linking', () => {
      const badges = el.querySelectorAll('ui-skill-badge');
      const ids = Array.from(badges).map((b) => b.getAttribute('id'));
      expect(ids).toContain('skill-python');
      expect(ids).toContain('skill-typescript');
      expect(ids).toContain('skill-github-actions');
    });
  });

  describe('mobile layout', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SkillsComponent],
        providers: [
          provideRouter([]),
          { provide: SkillsDataService, useValue: mockSkillsData },
          { provide: SkillUsageService, useValue: mockSkillUsage },
          { provide: MediaQueryService, useValue: createMockMediaQuery(true) },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();
      fixture = TestBed.createComponent(SkillsComponent);
      fixture.detectChanges();
      el = fixture.nativeElement;
    });

    it('shows the first 3 skills per category on mobile', () => {
      // Mobile column count drops to 3 to match `--mobile-max` in
      // MediaQueryService, and the visible cut tracks the column
      // count so a collapsed grid is always one clean row (never
      // 3 + 1 lonely-tile partials, which iteration 4 produced).
      const grids = el.querySelectorAll('.skill-grid');
      // Languages: 7 → 3
      expect(grids[0].querySelectorAll('ui-skill-badge').length).toBe(3);
      // AI & LLMs: 6 → 3
      expect(grids[5].querySelectorAll('ui-skill-badge').length).toBe(3);
    });

    it('reports the mobile hidden count in the toggle label', () => {
      const toggles = el.querySelectorAll('.expand-toggle');
      expect(toggles[0].textContent?.trim()).toContain('+ 4 more');
    });
  });

  describe('view mode', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SkillsComponent],
        providers: [
          provideRouter([]),
          { provide: SkillsDataService, useValue: mockSkillsData },
          { provide: SkillUsageService, useValue: mockSkillUsage },
          { provide: MediaQueryService, useValue: createMockMediaQuery(false) },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();
      fixture = TestBed.createComponent(SkillsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      el = fixture.nativeElement;
    });

    it('defaults to grid mode (feature strip + category sections visible, list view absent)', () => {
      expect(el.querySelector('app-skill-feature-card')).not.toBeNull();
      expect(el.querySelectorAll('.skill-section').length).toBe(6);
      expect(el.querySelector('app-skills-list-view')).toBeNull();
    });

    it('swaps to the list component when the List button is clicked', () => {
      const listBtn = el.querySelector('[aria-label="List view"]') as HTMLButtonElement;
      listBtn.click();
      fixture.detectChanges();
      expect(el.querySelector('app-skills-list-view')).not.toBeNull();
      expect(el.querySelector('app-skill-feature-card')).toBeNull();
      expect(el.querySelectorAll('.skill-section').length).toBe(0);
    });
  });
});
