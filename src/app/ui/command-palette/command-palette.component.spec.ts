import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplicationRef, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';
import { NavigationService } from '@core/services/navigation.service';
import { BlogService } from '@core/services/blog.service';
import { ThemeService } from '@core/services/theme.service';
import { SkillsDataService } from '@core/services/skills-data.service';
import { SkillUsageService } from '@core/services/skill-usage.service';
import type { SkillUsage } from '@core/services/skill-usage.service';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { THEME_REGISTRY, getThemeDef, type ThemeId } from '@core/services/theme.registry';
import type { BlogPost } from '@shared/models/blog-post.model';
import type { Project } from '@shared/models/project.model';
import type { Skill, SkillCategory } from '@shared/models/skill.model';
import { createMockProject } from '@testing/project-mocks';

const SIDEBAR = [
  {
    type: 'link' as const,
    label: 'About',
    ext: '.ts',
    route: '/about',
    icon: 'user',
  },
  {
    type: 'link' as const,
    label: 'Projects',
    ext: '.ts',
    route: '/projects',
    icon: 'folder',
  },
];

const POSTS = signal<BlogPost[]>([
  {
    slug: 'angular-21',
    title: 'Angular 21 Signals',
    date: '2025-01-01',
    excerpt: '',
    tags: [],
    readingTime: '3 min',
  },
  {
    slug: 'go-tour',
    title: 'A Go Tour',
    date: '2025-02-01',
    excerpt: '',
    tags: [],
    readingTime: '2 min',
  },
]);

/**
 * Mock ThemeService — the palette only needs `registry` (to enumerate
 * theme entries in the catalog) and `setTheme` (to fire on Enter).
 */
const themeSignal = signal<ThemeId>('crimson-dark');
const setThemeSpy = vi.fn();
const mockThemeService = {
  registry: THEME_REGISTRY,
  theme: themeSignal,
  themeDef: computed(() => getThemeDef(themeSignal())),
  scheme: computed(() => getThemeDef(themeSignal()).scheme),
  isDark: computed(() => getThemeDef(themeSignal()).scheme === 'dark'),
  toggle: vi.fn(),
  setTheme: setThemeSpy,
};

/**
 * Skills catalog used by palette tests. Two skills with project matches
 * (Rust, TypeScript) plus one orphan (Esoteric) so we can verify the
 * "hide zero-match skills" behaviour. A duplicate Rust entry in a
 * second category covers the de-dup path.
 */
const SKILL_CATEGORIES: SkillCategory[] = [
  {
    title: 'Languages',
    skills: [{ name: 'Rust' }, { name: 'TypeScript' }, { name: 'Esoteric' }],
  },
  {
    title: 'Other',
    skills: [{ name: 'Rust' }],
  },
];

const usageBySlug: Record<string, SkillUsage> = {
  rust: {
    slug: 'rust',
    projects: [
      { title: 'Atlas', description: '', image: '', link: '#', tags: ['Rust'] },
      { title: 'Beacon', description: '', image: '', link: '#', tags: ['Rust'] },
    ],
    posts: [
      {
        slug: 'p1',
        title: 'P1',
        date: '2025-01-01',
        excerpt: '',
        tags: ['Rust'],
        readingTime: '1 min',
      },
    ],
    projectsRouteSlug: 'rust',
    postsRouteSlug: 'rust',
  },
  typescript: {
    slug: 'typescript',
    projects: [{ title: 'Beacon', description: '', image: '', link: '#', tags: ['TypeScript'] }],
    posts: [],
    projectsRouteSlug: 'typescript',
    postsRouteSlug: null,
  },
  esoteric: {
    slug: 'esoteric',
    projects: [],
    posts: [],
    projectsRouteSlug: null,
    postsRouteSlug: null,
  },
};

const mockSkillsService = {
  categories: signal(SKILL_CATEGORIES),
};

/**
 * Projects catalog used by palette tests. Covers:
 *   - a featured entry (Atlas) so the "Featured" hint fragment is
 *     exercised,
 *   - a distinctive description keyword ("sudoku") that lets us
 *     verify the `keywords` fallback in the filter,
 *   - a second entry sharing a tag with one of the skill mocks (Rust)
 *     so we can assert tag-based search hits project rows too.
 */
const PROJECTS: Project[] = [
  createMockProject({
    title: 'Atlas',
    slug: 'atlas',
    description: 'Rust-based log indexer with a Kafka ingest pipeline.',
    image: 'a.png',
    link: 'https://github.com/example/atlas',
    tags: ['Rust', 'Kafka'],
    featured: true,
  }),
  createMockProject({
    title: 'Backtracking Search',
    slug: 'backtracking-search',
    description: 'Solves a 6x6 sudoku grid using constraint propagation.',
    image: 'b.png',
    link: 'https://github.com/example/backtracking',
    tags: ['Python', 'Algorithms'],
  }),
];

const mockProjectsService = {
  projects: signal(PROJECTS),
};

const mockSkillUsage: Pick<SkillUsageService, 'usageFor' | 'usageBySlug'> = {
  usageFor(skill: Skill): SkillUsage | undefined {
    const slug = skill.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return usageBySlug[slug];
  },
  usageBySlug: computed(() => usageBySlug),
};

/**
 * Number of unique skill entries the palette should render given the
 * catalog above: Rust (de-dup'd to 1) + TypeScript = 2. Esoteric is
 * filtered out because it has no project matches.
 */
const PALETTE_SKILL_COUNT = 2;

describe('CommandPaletteComponent', () => {
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let component: CommandPaletteComponent;
  let host: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    setThemeSpy.mockClear();
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [
        provideRouter([]),
        { provide: NavigationService, useValue: { sidebarItems: SIDEBAR } },
        { provide: BlogService, useValue: { posts: POSTS } },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: SkillsDataService, useValue: mockSkillsService },
        { provide: SkillUsageService, useValue: mockSkillUsage },
        { provide: ProjectsDataService, useValue: mockProjectsService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    // afterNextRender fires after the first render; let it attach the
    // global keydown listener before we dispatch events.
    await TestBed.inject(ApplicationRef).whenStable();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  // Narrow access to protected members for behavior assertions.
  function inner(): {
    open: () => boolean;
    query: () => string;
    highlighted: () => number;
    onKey: (e: KeyboardEvent) => void;
    onInput: (v: string) => void;
  } {
    return component as unknown as ReturnType<typeof inner>;
  }

  // Shared Cmd-K + type sequence used by every entry-filtering suite.
  // Closes over `inner` and `fixture` from this describe's scope.
  function openAndType(query: string) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    inner().onInput(query);
    fixture.detectChanges();
  }

  describe('keyboard toggle', () => {
    it('starts closed', () => {
      expect(inner().open()).toBe(false);
    });

    it('Cmd+K opens the palette', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      expect(inner().open()).toBe(true);
    });

    it('Ctrl+K opens the palette (Windows/Linux)', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      expect(inner().open()).toBe(true);
    });

    it('Cmd+K toggles open → closed → open', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      expect(inner().open()).toBe(true);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      expect(inner().open()).toBe(false);
    });

    it('Escape closes the palette when open', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      expect(inner().open()).toBe(true);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(inner().open()).toBe(false);
    });

    it('Escape does nothing while the palette is closed', () => {
      expect(inner().open()).toBe(false);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(inner().open()).toBe(false);
    });
  });

  describe('filtering', () => {
    it('starts with the full catalog (routes + posts + themes + skills + projects) when the query is empty', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      fixture.detectChanges();
      const items = host.querySelectorAll('.palette-item');
      expect(items.length).toBe(
        SIDEBAR.length +
          POSTS().length +
          THEME_REGISTRY.length +
          PALETTE_SKILL_COUNT +
          PROJECTS.length,
      );
    });

    it('filters by label, case-insensitive', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('ANGULAR');
      fixture.detectChanges();
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      expect(labels).toEqual(['Angular 21 Signals']);
    });

    it('filters by route', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      // Use a more specific route fragment so we don't also match the
      // skill entries whose routes are `/projects/tag/<slug>`. The
      // sidebar Projects entry is keyed `route:/projects` whereas the
      // skill entries are `route:/projects/tag/...`.
      inner().onInput('/about');
      fixture.detectChanges();
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      expect(labels).toEqual(['About']);
    });

    it('shows the "No matches." hint when nothing matches', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('zzz-never-matches');
      fixture.detectChanges();
      expect(host.querySelector('.palette-empty')?.textContent?.trim()).toBe('No matches.');
    });

    it('typing resets the highlighted index to 0', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(inner().highlighted()).toBe(1);
      inner().onInput('a');
      expect(inner().highlighted()).toBe(0);
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      fixture.detectChanges();
    });

    it('ArrowDown advances the highlighted item up to the last index', () => {
      const total =
        SIDEBAR.length +
        POSTS().length +
        THEME_REGISTRY.length +
        PALETTE_SKILL_COUNT +
        PROJECTS.length;
      for (let i = 0; i < total + 2; i++) {
        inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      }
      expect(inner().highlighted()).toBe(total - 1);
    });

    it('ArrowUp walks back toward 0 and clamps there', () => {
      inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(inner().highlighted()).toBe(2);
      for (let i = 0; i < 5; i++) {
        inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      }
      expect(inner().highlighted()).toBe(0);
    });

    it('Enter invokes router.navigate with the highlighted item route', () => {
      inner().onKey(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(router.navigate).toHaveBeenCalledWith(['/about']);
    });
  });

  describe('theme actions', () => {
    it('catalog includes a "Switch theme: …" entry per registered theme', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('switch theme');
      fixture.detectChanges();
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (n) => n.textContent?.trim() ?? '',
      );
      expect(labels.length).toBe(THEME_REGISTRY.length);
      for (const def of THEME_REGISTRY) {
        expect(labels).toContain(`Switch theme: ${def.label}`);
      }
    });

    it('typing the registry id also surfaces the matching theme entry', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('tokyo');
      fixture.detectChanges();
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (n) => n.textContent?.trim() ?? '',
      );
      expect(labels).toContain('Switch theme: Tokyo Night');
    });

    it('Enter on a theme entry calls themeService.setTheme without router.navigate', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('tokyo');
      fixture.detectChanges();
      inner().onKey(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(setThemeSpy).toHaveBeenCalledWith('tokyo-night');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('renders the theme swatch dot ahead of the icon for theme entries', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('rose pine');
      fixture.detectChanges();
      const swatch = host.querySelector('.palette-item .palette-swatch') as HTMLElement | null;
      expect(swatch).toBeTruthy();
      // jsdom normalises hex inline styles to `rgb(r, g, b)`. Convert the
      // registry swatch hex back to the same canonical form and compare
      // verbatim — keeps the assertion robust without leaking renderer
      // quirks into the spec body.
      const def = getThemeDef('rose-pine');
      const r = parseInt(def.swatch.slice(1, 3), 16);
      const g = parseInt(def.swatch.slice(3, 5), 16);
      const b = parseInt(def.swatch.slice(5, 7), 16);
      expect(swatch?.style.backgroundColor).toBe(`rgb(${r}, ${g}, ${b})`);
    });

    it('non-theme entries (routes, posts) do not render a swatch', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('about');
      fixture.detectChanges();
      const items = host.querySelectorAll('.palette-item');
      const swatches = host.querySelectorAll('.palette-item .palette-swatch');
      expect(items.length).toBeGreaterThan(0);
      expect(swatches.length).toBe(0);
    });
  });

  describe('openWith()', () => {
    it('opens the dialog and pre-fills the query string', () => {
      component.openWith('theme:');
      expect(inner().open()).toBe(true);
      expect(inner().query()).toBe('theme:');
    });
  });

  describe('focus restoration on close', () => {
    /*
      A11y contract: every modal that takes keyboard focus must give it
      back when it closes. Pre-fix the palette `close()` left focus on
      `<body>`, breaking keyboard tab order for every user that opened
      the palette and dismissed without selecting (Esc, click-outside,
      X, action items).
    */
    it('restores focus to the trigger element when the palette closes', async () => {
      // Mount a real button into the test DOM and focus it — the palette
      // should snapshot it on open and refocus it on close.
      const trigger = document.createElement('button');
      trigger.id = 'palette-trigger-spec';
      trigger.textContent = 'Open palette';
      document.body.appendChild(trigger);
      try {
        trigger.focus();
        expect(document.activeElement).toBe(trigger);

        component.openWith('');
        await new Promise<void>((r) => queueMicrotask(() => r()));
        // Palette opened — focus moved to the input. Sanity-check.
        expect(document.activeElement).not.toBe(trigger);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).close();
        await new Promise<void>((r) => queueMicrotask(() => r()));
        expect(document.activeElement).toBe(trigger);
      } finally {
        trigger.remove();
      }
    });

    it('skips restoration when the captured trigger has been removed', async () => {
      // Mobile drawer flow: the Search button unmounts before the
      // palette closes. Focus should silently fall back to <body>
      // rather than crash on a focus() call to a detached node.
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      component.openWith('');
      await new Promise<void>((r) => queueMicrotask(() => r()));

      trigger.remove();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (component as any).close()).not.toThrow();
      await new Promise<void>((r) => queueMicrotask(() => r()));
      // No assertion on activeElement target — just that close() didn't
      // throw and the previouslyFocused field got cleared.
    });
  });

  describe('skill actions', () => {
    it('emits one route entry per skill that has at least one project', () => {
      openAndType('');
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      // Two skills with projects (Rust, TypeScript). Esoteric is excluded
      // because it would land on an empty archive.
      expect(labels.filter((l) => l === 'Rust' || l === 'TypeScript').length).toBe(2);
      expect(labels).not.toContain('Esoteric');
    });

    it('renders a hint with project + post counts (omits posts when zero)', () => {
      openAndType('rust');
      const hints = Array.from(host.querySelectorAll('.palette-hint')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      expect(hints).toContain('Skill · 2 projects · 1 post');

      openAndType('typescript');
      const tsHints = Array.from(host.querySelectorAll('.palette-hint')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      // 0 posts → the hint reads "Skill · 1 project" with no post fragment.
      expect(tsHints).toContain('Skill · 1 project');
    });

    it('Enter on a skill entry navigates to /projects/tag/<routeSlug>', () => {
      openAndType('rust');
      inner().onKey(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(router.navigate).toHaveBeenCalledWith(['/projects/tag/rust']);
    });

    it('does not duplicate skill entries when the same skill appears in two categories', () => {
      openAndType('rust');
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      // The mock seeds Rust under both "Languages" and "Other".
      expect(labels.filter((l) => l === 'Rust').length).toBe(1);
    });
  });

  describe('project entries', () => {
    it('emits one entry per project with a Project hint', () => {
      openAndType('');
      const rows = Array.from(host.querySelectorAll('.palette-item')).map((el) => ({
        label: el.querySelector('.palette-label')?.textContent?.trim() ?? '',
        hint: el.querySelector('.palette-hint')?.textContent?.trim() ?? '',
      }));
      expect(rows.some((r) => r.label === 'Atlas' && r.hint.startsWith('Project'))).toBe(true);
      expect(
        rows.some((r) => r.label === 'Backtracking Search' && r.hint.startsWith('Project')),
      ).toBe(true);
    });

    it('marks featured projects with a "Featured" fragment in the hint', () => {
      openAndType('atlas');
      const hints = Array.from(host.querySelectorAll('.palette-hint')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      // Atlas is featured and has 2 tags: expect "Project · Featured · 2 tags".
      expect(hints).toContain('Project · Featured · 2 tags');
    });

    it('Enter on a project entry navigates to the /projects/:slug detail page', () => {
      openAndType('atlas');
      inner().onKey(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(router.navigate).toHaveBeenCalledWith(['/projects/atlas']);
    });

    it('surfaces a project via a description keyword that is not in the title', () => {
      // "sudoku" only appears in the Backtracking Search description, not
      // its title or tags. The `keywords` field folds description + tags
      // into the filter so typing "sudoku" still finds the card.
      openAndType('sudoku');
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      expect(labels).toContain('Backtracking Search');
    });
  });
});
