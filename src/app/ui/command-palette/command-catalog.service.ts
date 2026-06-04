import { Service, computed, inject } from '@angular/core';
import { NavigationService } from '@core/services/navigation.service';
import { BlogService } from '@core/services/blog.service';
import { ThemeService } from '@core/services/theme.service';
import { SkillsDataService } from '@core/services/skills-data.service';
import { SkillUsageService } from '@core/services/skill-usage.service';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { slugify } from '@shared/utils/string.utils';

/**
 * Discriminator separates plain navigation from in-place actions
 * (theme switch, future "copy URL" / "view JSON" entries). Keeping
 * the kind explicit means the consumer's `select()` can't accidentally
 * `router.navigate(undefined)` on an action item.
 */
export type CommandKind = 'route' | 'action';

export interface CommandItem {
  /** Stable id for keyboard selection / track-by (e.g. `route:/about`). */
  id: string;
  /**
   * DOM-safe variant of `id` used as the `id` attribute on the option
   * element and as the `aria-activedescendant` target on the input.
   * `id` itself contains characters (`:` `/`) that survive HTML5 but
   * are brittle in CSS selectors / `getElementById` queries.
   */
  domId: string;
  /** What the user reads in the list. */
  label: string;
  /** Smaller secondary label (e.g. "Blog post", "Page", "Theme · Dark"). */
  hint: string;
  /** Icon name. */
  icon: string;
  /** Determines which arm of the consumer's `select()` runs. */
  kind: CommandKind;
  /** Click target — only meaningful when `kind === 'route'`. */
  route?: string;
  /**
   * Optional URL fragment for `kind === 'route'` entries. Used today
   * by project entries to land on a specific card within `/projects`
   * (`#project-<slug>`); reserved for skills-page deep links too.
   */
  fragment?: string;
  /** Side effect — only meaningful when `kind === 'action'`. */
  run?: () => void;
  /**
   * Extra lowercased search terms folded into the consumer's fuzzy
   * filter. Projects use this to surface hits when the user types a
   * tag or description word (e.g. "sudoku" → Backtracking Search).
   * Separate from `label` so the visible row stays compact while
   * search stays permissive.
   */
  keywords?: string;
  /**
   * Optional accent dot rendered ahead of the icon. Used by theme
   * entries to preview the active accent for each theme without
   * enumerating yet another icon per theme.
   */
  swatch?: string;
}

/**
 * Map a logical item id (`route:/about`, `post:my-slug`) to an HTML id
 * suitable for `aria-activedescendant`. Replaces any non-`[A-Za-z0-9_-]`
 * character with a single dash so the result clears CSS selector rules
 * and the SR announces an unambiguous reference target.
 */
function toDomId(id: string): string {
  return 'palette-option-' + id.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Source of truth for the command-palette catalog: every navigable
 * destination (sidebar nav routes, blog posts, project detail pages,
 * skill archives) plus every in-place action (theme switches).
 *
 * Extracted from `CommandPaletteComponent` so the catalog shape, item
 * ordering, hint strings, and de-duplication rules can be tested in
 * isolation without spinning up a component fixture. The component
 * keeps the keyboard / focus / dialog mechanics; this service owns the
 * data contract.
 *
 * Sits next to the component (not in `core/services`) because the
 * `CommandItem` shape is bespoke to the palette and no other surface
 * in the app needs it today.
 */
@Service()
export class CommandCatalogService {
  private nav = inject(NavigationService);
  private blog = inject(BlogService);
  private theme = inject(ThemeService);
  private skills = inject(SkillsDataService);
  private skillUsage = inject(SkillUsageService);
  private projectsData = inject(ProjectsDataService);

  /**
   * Catalog: every nav route + every blog post + every theme action +
   * every skill with at least one project match + every project. Stable
   * ordering — ranking / recently-visited boosting can layer on top
   * later without changing the shape.
   */
  readonly items = computed<CommandItem[]>(() => {
    const out: CommandItem[] = [];

    for (const item of this.nav.sidebarItems) {
      if (item.type === 'link') {
        const id = `route:${item.route}`;
        out.push({
          id,
          domId: toDomId(id),
          label: item.label,
          hint: 'Page',
          icon: item.icon,
          kind: 'route',
          route: item.route,
        });
      }
    }

    for (const post of this.blog.posts()) {
      const id = `post:${post.slug}`;
      out.push({
        id,
        domId: toDomId(id),
        label: post.title,
        hint: 'Blog post',
        icon: 'file-text',
        kind: 'route',
        route: `/blog/${post.slug}`,
      });
    }

    for (const def of this.theme.registry) {
      const id = `theme:${def.id}`;
      out.push({
        id,
        domId: toDomId(id),
        label: `Switch theme: ${def.label}`,
        hint: def.scheme === 'dark' ? 'Theme · Dark' : 'Theme · Light',
        icon: 'palette',
        kind: 'action',
        run: () => this.theme.setTheme(def.id),
        swatch: def.swatch,
      });
    }

    // Skill entries deep-link into `/projects/tag/<slug>`. Skills with
    // zero project matches are intentionally hidden — they'd land the
    // user on an empty archive, which makes the palette feel broken.
    // Once the skill is referenced by any project tag, it shows up
    // automatically (the `usageFor()` read inside this `computed()`
    // tracks `usageBySlug()` for reactivity).
    const seenSkillIds = new Set<string>();
    for (const cat of this.skills.categories()) {
      for (const skill of cat.skills) {
        const usage = this.skillUsage.usageFor(skill);
        if (!usage || !usage.projectsRouteSlug || usage.projects.length === 0) continue;
        // Defensive de-duplication: a future copy-paste mistake that lists
        // the same skill in two categories would otherwise emit two
        // palette rows pointing at the same archive.
        const id = `skill:${usage.slug}`;
        if (seenSkillIds.has(id)) continue;
        seenSkillIds.add(id);
        const projectCount = usage.projects.length;
        const postCount = usage.posts.length;
        const hintParts = [`${projectCount} project${projectCount === 1 ? '' : 's'}`];
        if (postCount > 0) {
          hintParts.push(`${postCount} post${postCount === 1 ? '' : 's'}`);
        }
        out.push({
          id,
          domId: toDomId(id),
          label: skill.name,
          hint: `Skill · ${hintParts.join(' · ')}`,
          icon: 'hash',
          kind: 'route',
          route: `/projects/tag/${usage.projectsRouteSlug}`,
        });
      }
    }

    // Project entries deep-link into the `/projects/:slug` detail page.
    // That's the canonical, richer surface; the `/projects#project-<slug>`
    // scroll target remains supported by direct-URL traffic (old bookmarks,
    // external deep links) but the palette prefers the detail route.
    for (const project of this.projectsData.projects()) {
      const slug = project.slug ?? slugify(project.title);
      if (!slug) continue;
      const id = `project:${slug}`;
      const tagCount = project.tags.length;
      const hint = project.featured
        ? `Project · Featured · ${tagCount} tag${tagCount === 1 ? '' : 's'}`
        : `Project · ${tagCount} tag${tagCount === 1 ? '' : 's'}`;
      out.push({
        id,
        domId: toDomId(id),
        label: project.title,
        hint,
        icon: 'github',
        kind: 'route',
        route: `/projects/${slug}`,
        keywords: [...project.tags, project.description].join(' ').toLowerCase(),
      });
    }

    return out;
  });
}
