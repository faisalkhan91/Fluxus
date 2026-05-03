import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SkillUsageService } from './skill-usage.service';
import { SkillsDataService } from './skills-data.service';
import { ProjectsDataService } from './projects-data.service';
import { BlogService } from './blog.service';
import { Project } from '@shared/models/project.model';
import { BlogPost } from '@shared/models/blog-post.model';
import { SkillCategory } from '@shared/models/skill.model';

/**
 * Why a fully-mocked TestBed instead of `inject(SkillsDataService)` etc.:
 * keeping the seed data tiny makes alias / dedup / reactivity assertions
 * unambiguous and decouples this spec from edits to the real catalogs.
 */

const SKILLS: SkillCategory[] = [
  {
    title: 'Languages',
    skills: [
      { name: 'Rust' },
      { name: 'TypeScript' },
      // HTML5 carries an alias to match project tags spelled "HTML" — this
      // is the canonical exercise of the `aliases` field.
      { name: 'HTML5', aliases: ['HTML'] },
      // No projects/posts will reference "Esoteric" — it should resolve to
      // a usage with empty arrays + null route slugs.
      { name: 'Esoteric' },
    ],
  },
  {
    title: 'CI/CD & DevOps',
    skills: [
      // Display name slugifies to `cicd` and so does the project tag
      // "CI/CD" (slugify strips `/`). Confirms the exact-match path.
      { name: 'CI/CD' },
    ],
  },
];

const PROJECTS: Project[] = [
  {
    title: 'Atlas',
    description: '',
    image: 'a.png',
    link: '#',
    tags: ['Rust', 'CI/CD'],
  },
  {
    title: 'Beacon',
    description: '',
    image: 'b.png',
    link: '#',
    tags: ['Rust', 'TypeScript'],
  },
  {
    title: 'Citrus',
    description: '',
    image: 'c.png',
    link: '#',
    // Lowercase tag — slugify normalises both sides so casing doesn't matter.
    tags: ['html'],
  },
];

const POSTS: BlogPost[] = [
  {
    slug: 'rusty-thoughts',
    title: 'Rusty Thoughts',
    date: '2025-01-01',
    excerpt: '',
    tags: ['Rust'],
    readingTime: '3 min',
  },
  {
    slug: 'ts-style-guide',
    title: 'TS Style Guide',
    date: '2025-02-01',
    excerpt: '',
    tags: ['TypeScript', 'Rust'],
    readingTime: '4 min',
  },
];

describe('SkillUsageService', () => {
  let service: SkillUsageService;
  let projectsSignal: ReturnType<typeof signal<Project[]>>;
  let postsSignal: ReturnType<typeof signal<BlogPost[]>>;
  let categoriesSignal: ReturnType<typeof signal<SkillCategory[]>>;

  beforeEach(() => {
    projectsSignal = signal<Project[]>(PROJECTS);
    postsSignal = signal<BlogPost[]>(POSTS);
    categoriesSignal = signal<SkillCategory[]>(SKILLS);

    TestBed.configureTestingModule({
      providers: [
        SkillUsageService,
        { provide: SkillsDataService, useValue: { categories: categoriesSignal } },
        { provide: ProjectsDataService, useValue: { projects: projectsSignal } },
        { provide: BlogService, useValue: { posts: postsSignal } },
      ],
    });
    service = TestBed.inject(SkillUsageService);
  });

  it('joins projects + posts onto a skill via the canonical slug', () => {
    const usage = service.usageFor({ name: 'Rust' });
    expect(usage).toBeDefined();
    expect(usage!.slug).toBe('rust');
    expect(usage!.projects.map((p) => p.title)).toEqual(['Atlas', 'Beacon']);
    expect(usage!.posts.map((p) => p.slug)).toEqual(['rusty-thoughts', 'ts-style-guide']);
    expect(usage!.projectsRouteSlug).toBe('rust');
    expect(usage!.postsRouteSlug).toBe('rust');
  });

  it('uses an alias slug for the route when the canonical slug has no project matches', () => {
    // HTML5's canonical slug is `html5`; project tags only spell it `html`.
    // The route must point to /projects/tag/html so the user lands on
    // the actual archive instead of an empty `html5` page.
    const usage = service.usageFor({ name: 'HTML5', aliases: ['HTML'] });
    expect(usage).toBeDefined();
    expect(usage!.slug).toBe('html5');
    expect(usage!.projectsRouteSlug).toBe('html');
    expect(usage!.projects.map((p) => p.title)).toEqual(['Citrus']);
  });

  it('matches CI/CD via slug normalisation (both sides slugify to "cicd")', () => {
    const usage = service.usageFor({ name: 'CI/CD' });
    expect(usage).toBeDefined();
    expect(usage!.slug).toBe('cicd');
    expect(usage!.projectsRouteSlug).toBe('cicd');
    expect(usage!.projects.map((p) => p.title)).toEqual(['Atlas']);
  });

  it('returns empty arrays + null route slugs for skills with no matches', () => {
    const usage = service.usageFor({ name: 'Esoteric' });
    expect(usage).toBeDefined();
    expect(usage!.projects).toEqual([]);
    expect(usage!.posts).toEqual([]);
    expect(usage!.projectsRouteSlug).toBeNull();
    expect(usage!.postsRouteSlug).toBeNull();
  });

  it('returns undefined for a skill whose name does not slugify (defensive)', () => {
    expect(service.usageFor({ name: '   ' })).toBeUndefined();
    expect(service.usageFor({ name: '!!!' })).toBeUndefined();
  });

  it('reactively updates counts when blog posts change', () => {
    expect(service.usageFor({ name: 'TypeScript' })!.posts.length).toBe(1);
    postsSignal.update((curr) => [
      ...curr,
      {
        slug: 'ts-2',
        title: 'TS 2',
        date: '2025-03-01',
        excerpt: '',
        tags: ['TypeScript'],
        readingTime: '2 min',
      },
    ]);
    expect(service.usageFor({ name: 'TypeScript' })!.posts.length).toBe(2);
  });

  it('reactively updates counts when projects change', () => {
    expect(service.usageFor({ name: 'TypeScript' })!.projects.length).toBe(1);
    projectsSignal.update((curr) => [
      ...curr,
      {
        title: 'Delta',
        description: '',
        image: 'd.png',
        link: '#',
        tags: ['TypeScript'],
      },
    ]);
    expect(service.usageFor({ name: 'TypeScript' })!.projects.length).toBe(2);
  });

  it('omits zero-match skills from the route slug but keeps them in usageBySlug', () => {
    const map = service.usageBySlug();
    expect(map['esoteric']).toBeDefined();
    expect(map['esoteric'].projectsRouteSlug).toBeNull();
    expect(map['esoteric'].postsRouteSlug).toBeNull();
  });

  it('de-duplicates skills with identical canonical slugs', () => {
    // Add a duplicate "rust" skill in another category. The map should still
    // hold a single entry keyed by the canonical slug so downstream UIs
    // (palette, badges) don't render two clickable rows that point to the
    // same place.
    categoriesSignal.update((curr) => [...curr, { title: 'Other', skills: [{ name: 'Rust' }] }]);
    const map = service.usageBySlug();
    expect(Object.keys(map).filter((s) => s === 'rust').length).toBe(1);
  });
});
