import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommandCatalogService, type CommandItem } from './command-catalog.service';
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

/**
 * Service-level spec for the command-palette catalog. The component spec
 * (`command-palette.component.spec.ts`) drives the same data through the
 * rendered listbox; this one exercises the `items()` contract directly —
 * `toDomId` sanitization, per-source hint strings, skill de-dup, the
 * "hide zero-match skills" rule, the slug fallback, and overall ordering —
 * without a component fixture. Render-neutral: no DOM, no router.
 */

const SIDEBAR = [
  { type: 'link' as const, label: 'About', ext: '.ts', route: '/about', icon: 'user' },
  { type: 'link' as const, label: 'Projects', ext: '.ts', route: '/projects', icon: 'folder' },
  // A non-link entry (section header / divider) must be skipped by the catalog.
  { type: 'header' as const, label: 'Section' },
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
]);

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

// Rust + TypeScript have project matches; Esoteric has none (must be hidden);
// Rust is duplicated in a second category to cover the de-dup path.
const SKILL_CATEGORIES: SkillCategory[] = [
  { title: 'Languages', skills: [{ name: 'Rust' }, { name: 'TypeScript' }, { name: 'Esoteric' }] },
  { title: 'Other', skills: [{ name: 'Rust' }] },
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

const mockSkillsService = { categories: signal(SKILL_CATEGORIES) };

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

const mockProjectsService = { projects: signal(PROJECTS) };

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

describe('CommandCatalogService', () => {
  let service: CommandCatalogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CommandCatalogService,
        { provide: NavigationService, useValue: { sidebarItems: SIDEBAR } },
        { provide: BlogService, useValue: { posts: POSTS } },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: SkillsDataService, useValue: mockSkillsService },
        { provide: SkillUsageService, useValue: mockSkillUsage },
        { provide: ProjectsDataService, useValue: mockProjectsService },
      ],
    });
    service = TestBed.inject(CommandCatalogService);
  });

  const items = (): CommandItem[] => service.items();
  const byId = (id: string) => items().find((i) => i.id === id);

  describe('navigation routes', () => {
    it('emits one route entry per sidebar link and skips non-link entries', () => {
      const routes = items().filter((i) => i.id.startsWith('route:'));
      expect(routes.map((r) => r.route)).toEqual(['/about', '/projects']);
      // The 'header' sidebar entry produced no catalog row.
      expect(routes.length).toBe(2);
    });

    it('tags each nav entry as a route with the "Page" hint', () => {
      const about = byId('route:/about')!;
      expect(about.kind).toBe('route');
      expect(about.hint).toBe('Page');
      expect(about.label).toBe('About');
      expect(about.icon).toBe('user');
    });
  });

  describe('toDomId sanitization', () => {
    it('replaces ":" and "/" with single dashes for the route id', () => {
      expect(byId('route:/about')!.domId).toBe('palette-option-route-about');
    });

    it('preserves dashes already present in the source id', () => {
      expect(byId('theme:crimson-dark')!.domId).toBe('palette-option-theme-crimson-dark');
    });

    it('produces a DOM-safe id with no ":" or "/" for every catalog item', () => {
      for (const item of items()) {
        expect(item.domId.startsWith('palette-option-')).toBe(true);
        expect(item.domId).not.toMatch(/[^A-Za-z0-9_-]/);
      }
    });
  });

  describe('blog posts', () => {
    it('emits a route entry per post pointing at /blog/<slug>', () => {
      const post = byId('post:angular-21')!;
      expect(post.kind).toBe('route');
      expect(post.route).toBe('/blog/angular-21');
      expect(post.hint).toBe('Blog post');
      expect(post.label).toBe('Angular 21 Signals');
    });
  });

  describe('theme actions', () => {
    it('emits one action entry per registered theme with a run callback and swatch', () => {
      const themes = items().filter((i) => i.id.startsWith('theme:'));
      expect(themes.length).toBe(THEME_REGISTRY.length);
      for (const t of themes) {
        expect(t.kind).toBe('action');
        expect(typeof t.run).toBe('function');
        expect(t.swatch).toBeTruthy();
        expect(t.route).toBeUndefined();
      }
    });

    it('labels the scheme in the hint (Dark vs Light)', () => {
      for (const def of THEME_REGISTRY) {
        const entry = byId(`theme:${def.id}`)!;
        expect(entry.hint).toBe(def.scheme === 'dark' ? 'Theme · Dark' : 'Theme · Light');
      }
    });

    it('run() delegates to themeService.setTheme with the theme id', () => {
      setThemeSpy.mockClear();
      byId('theme:tokyo-night')!.run!();
      expect(setThemeSpy).toHaveBeenCalledWith('tokyo-night');
    });
  });

  describe('skill entries', () => {
    it('surfaces only skills with at least one project match', () => {
      const skills = items().filter((i) => i.id.startsWith('skill:'));
      const slugs = skills.map((s) => s.id);
      expect(slugs).toContain('skill:rust');
      expect(slugs).toContain('skill:typescript');
      expect(slugs).not.toContain('skill:esoteric');
    });

    it('de-duplicates a skill that appears in two categories', () => {
      const rust = items().filter((i) => i.id === 'skill:rust');
      expect(rust.length).toBe(1);
    });

    it('routes a skill into its /projects/tag/<slug> archive', () => {
      expect(byId('skill:rust')!.route).toBe('/projects/tag/rust');
    });

    it('builds a hint with project + post counts, omitting posts when zero', () => {
      // Rust: 2 projects + 1 post.
      expect(byId('skill:rust')!.hint).toBe('Skill · 2 projects · 1 post');
      // TypeScript: 1 project, 0 posts → no post fragment.
      expect(byId('skill:typescript')!.hint).toBe('Skill · 1 project');
    });
  });

  describe('project entries', () => {
    it('emits one entry per project routing to /projects/:slug', () => {
      expect(byId('project:atlas')!.route).toBe('/projects/atlas');
      expect(byId('project:backtracking-search')!.route).toBe('/projects/backtracking-search');
    });

    it('marks featured projects in the hint and counts tags', () => {
      expect(byId('project:atlas')!.hint).toBe('Project · Featured · 2 tags');
      expect(byId('project:backtracking-search')!.hint).toBe('Project · 2 tags');
    });

    it('folds tags + description into lowercased keywords', () => {
      const atlas = byId('project:atlas')!;
      expect(atlas.keywords).toContain('rust');
      expect(atlas.keywords).toContain('kafka');
      expect(atlas.keywords).toContain('log indexer');
      expect(atlas.keywords).toBe(atlas.keywords?.toLowerCase());
    });

    it('falls back to slugify(title) when a project has no slug', () => {
      mockProjectsService.projects.set([
        createMockProject({
          title: 'No Slug Here',
          slug: undefined,
          description: 'x',
          image: 'x.png',
          link: '#',
          tags: ['T'],
        }),
      ]);
      const slugged = items().find((i) => i.label === 'No Slug Here')!;
      expect(slugged.id).toBe('project:no-slug-here');
      expect(slugged.route).toBe('/projects/no-slug-here');
      // Restore for any later test ordering.
      mockProjectsService.projects.set(PROJECTS);
    });
  });

  describe('catalog ordering', () => {
    it('orders sources: routes → posts → themes → skills → projects', () => {
      const all = items();
      const firstOf = (prefix: string) => all.findIndex((i) => i.id.startsWith(prefix));
      const lastOf = (prefix: string) =>
        all.length - 1 - [...all].reverse().findIndex((i) => i.id.startsWith(prefix));

      expect(lastOf('route:')).toBeLessThan(firstOf('post:'));
      expect(lastOf('post:')).toBeLessThan(firstOf('theme:'));
      expect(lastOf('theme:')).toBeLessThan(firstOf('skill:'));
      expect(lastOf('skill:')).toBeLessThan(firstOf('project:'));
    });

    it('exposes the full catalog length = routes + posts + themes + skills + projects', () => {
      const expected = 2 + POSTS().length + THEME_REGISTRY.length + 2 + PROJECTS.length;
      expect(items().length).toBe(expected);
    });
  });
});
