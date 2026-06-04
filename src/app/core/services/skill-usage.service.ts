import { Service, inject, computed } from '@angular/core';
import type { Project } from '@shared/models/project.model';
import type { BlogPost } from '@shared/models/blog-post.model';
import type { Skill } from '@shared/models/skill.model';
import { ProjectsDataService } from './projects-data.service';
import { BlogService } from './blog.service';
import { SkillsDataService } from './skills-data.service';
import { slugify } from '@shared/utils/string.utils';

/**
 * Resolution of a single skill against the project + blog catalogs. The
 * skills page renders these straight onto the badge (link target, count
 * pills), and the command palette uses them to hide skills that would
 * dead-end on a "no projects found" page.
 */
export interface SkillUsage {
  /** Canonical id — `slugify(skill.name)`. Stable across sessions. */
  slug: string;
  /** Projects that mention the skill via name or any alias. De-duplicated. */
  projects: Project[];
  /** Published blog posts that mention the skill via name or any alias. */
  posts: BlogPost[];
  /**
   * URL slug for the projects deep link. Picks the first variant from
   * `[name, ...aliases]` (slugified) that actually yields project matches,
   * so a `HTML5` badge with `aliases: ['HTML']` routes to
   * `/projects/tag/html` (where the projects live) rather than
   * `/projects/tag/html5` (an empty page). `null` when nothing matches —
   * caller should render the badge as a non-link.
   */
  projectsRouteSlug: string | null;
  /** Same shape as `projectsRouteSlug`, but for `/blog/tag/<slug>`. */
  postsRouteSlug: string | null;
}

/**
 * Joins skills against project tags and blog post tags via `slugify()` on
 * both sides. Acts as the connective tissue between the Skills page,
 * Projects, Blog tag archives, and the Cmd+K palette.
 *
 * Computed end-to-end so reactivity flows from the underlying signals
 * (`ProjectsDataService.projects()`, `BlogService.posts()`,
 * `SkillsDataService.categories()`) without manual subscription.
 */
@Service()
export class SkillUsageService {
  private skillsData = inject(SkillsDataService);
  private projectsData = inject(ProjectsDataService);
  private blog = inject(BlogService);

  /**
   * Index of `slugified-tag → projects[]` built once per `projects()` tick.
   * Pre-bucketing means the per-skill loop in `usageBySlug` is O(skills *
   * variants) instead of O(skills * projects * tags).
   */
  private readonly projectsBySlug = computed<Map<string, Project[]>>(() => {
    const map = new Map<string, Project[]>();
    for (const project of this.projectsData.projects()) {
      for (const tag of project.tags) {
        const slug = slugify(tag);
        if (!slug) continue;
        const list = map.get(slug);
        if (list) list.push(project);
        else map.set(slug, [project]);
      }
    }
    return map;
  });

  /** Same shape as `projectsBySlug`, but keyed off published blog posts. */
  private readonly postsBySlug = computed<Map<string, BlogPost[]>>(() => {
    const map = new Map<string, BlogPost[]>();
    for (const post of this.blog.posts()) {
      for (const tag of post.tags) {
        const slug = slugify(tag);
        if (!slug) continue;
        const list = map.get(slug);
        if (list) list.push(post);
        else map.set(slug, [post]);
      }
    }
    return map;
  });

  /**
   * `slugify(skill.name) → SkillUsage` for every skill in the catalog.
   * Drives both badge wiring on `/skills` and palette catalog filtering.
   *
   * Skills with the same canonical slug are de-duplicated by first
   * occurrence (the catalog never lists duplicates today; this is just
   * defensive so a future copy-paste mistake doesn't double-count).
   */
  readonly usageBySlug = computed<Readonly<Record<string, SkillUsage>>>(() => {
    const projects = this.projectsBySlug();
    const posts = this.postsBySlug();
    const out: Record<string, SkillUsage> = {};
    for (const cat of this.skillsData.categories()) {
      for (const skill of cat.skills) {
        const usage = resolveSkill(skill, projects, posts);
        if (!usage) continue;
        if (out[usage.slug]) continue;
        out[usage.slug] = usage;
      }
    }
    return out;
  });

  /** Lookup helper for templates / external callers. */
  usageFor(skill: Skill): SkillUsage | undefined {
    const slug = slugify(skill.name);
    if (!slug) return undefined;
    return this.usageBySlug()[slug];
  }

  /**
   * Memoized index of skill slugs: the set of every known slug (skill names
   * and aliases) plus an alias→canonical map. Rebuilt once per
   * `categories()` tick so `isKnownSkillSlug` / `canonicalSkillSlug` are O(1)
   * — `ProjectDetailComponent` previously rebuilt this map on every render.
   */
  private readonly skillSlugIndex = computed(() => {
    const known = new Set<string>();
    const aliasToCanonical = new Map<string, string>();
    for (const cat of this.skillsData.categories()) {
      for (const skill of cat.skills) {
        const canonical = slugify(skill.name);
        if (canonical) {
          known.add(canonical);
          aliasToCanonical.set(canonical, canonical);
        }
        for (const alias of skill.aliases ?? []) {
          const a = slugify(alias);
          if (!a) continue;
          known.add(a);
          if (canonical) aliasToCanonical.set(a, canonical);
        }
      }
    }
    return { known, aliasToCanonical };
  });

  /** True when `slug` matches a known skill name or alias. */
  isKnownSkillSlug(slug: string): boolean {
    return this.skillSlugIndex().known.has(slug);
  }

  /**
   * Fold a (possibly alias) skill slug to its canonical skill-name slug — the
   * id the rendered badge carries (`#skill-<canonical>`). Returns the input
   * unchanged when it isn't a known alias.
   */
  canonicalSkillSlug(slug: string): string {
    return this.skillSlugIndex().aliasToCanonical.get(slug) ?? slug;
  }

  /**
   * Published blog posts carrying at least one tag whose slug is in
   * `tagSlugs`. De-duplicated and returned in `BlogService.posts()` order
   * (date-descending). Lets callers (project detail) reuse the one
   * tag→post matching path instead of re-implementing it.
   */
  postsForTagSlugs(tagSlugs: Iterable<string>): BlogPost[] {
    const wanted = new Set<string>();
    for (const slug of tagSlugs) if (slug) wanted.add(slug);
    if (wanted.size === 0) return [];
    return this.blog
      .posts()
      .filter((post) => (post.tags ?? []).some((t) => wanted.has(slugify(t))));
  }
}

function resolveSkill(
  skill: Skill,
  projectsBySlug: ReadonlyMap<string, Project[]>,
  postsBySlug: ReadonlyMap<string, BlogPost[]>,
): SkillUsage | null {
  const variants = [skill.name, ...(skill.aliases ?? [])]
    .map((v) => slugify(v))
    .filter((v): v is string => !!v);
  if (variants.length === 0) return null;
  const canonical = variants[0];

  const projectSet = new Set<Project>();
  const postSet = new Set<BlogPost>();
  let projectsRouteSlug: string | null = null;
  let postsRouteSlug: string | null = null;

  for (const v of variants) {
    const matchedProjects = projectsBySlug.get(v);
    if (matchedProjects && matchedProjects.length > 0) {
      for (const p of matchedProjects) projectSet.add(p);
      if (projectsRouteSlug === null) projectsRouteSlug = v;
    }
    const matchedPosts = postsBySlug.get(v);
    if (matchedPosts && matchedPosts.length > 0) {
      for (const post of matchedPosts) postSet.add(post);
      if (postsRouteSlug === null) postsRouteSlug = v;
    }
  }

  return {
    slug: canonical,
    projects: Array.from(projectSet),
    posts: Array.from(postSet),
    projectsRouteSlug,
    postsRouteSlug,
  };
}
