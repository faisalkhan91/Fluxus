import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  PLATFORM_ID,
  inject,
  signal,
  computed,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { IconComponent } from '@ui/icon/icon.component';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { SkillBadgeComponent } from '@ui/skill-badge/skill-badge.component';
import { SkillsDataService } from '@core/services/skills-data.service';
import { SkillUsageService } from '@core/services/skill-usage.service';
import type { SkillUsage } from '@core/services/skill-usage.service';
import { MediaQueryService } from '@core/services/media-query.service';
import type { SkillCategory, Skill } from '@shared/models/skill.model';
import { slugify } from '@shared/utils/string.utils';
import { prefersReducedMotion } from '@shared/utils/motion.utils';
import { SkillFeatureCardComponent } from './skill-feature-card.component';
import { SkillsListViewComponent } from './skills-list-view.component';

type ViewMode = 'grid' | 'list';

/**
 * Cap on the featured strip — one curated lead per top-level
 * category (six categories ship at the time of writing, so the cap
 * doubles as a "one per category" budget without a per-category
 * filter pass).
 *
 * Layout (see `.feature-strip` in `skills.component.css`):
 *   ≥ 641 px : `repeat(3, 1fr)` → 3 columns × 2 rows
 *   ≤ 640 px : horizontal scroll rail with snap, 240 px min track
 *
 * Tried a 6-wide single-row strip at 1280 px+; names wrapped
 * mid-word ("PostgreSQ…", "GitHub\nActions") and taglines clipped at
 * two words, so the 3 × 2 composition is intentional.
 */
const FEATURE_CAP = 6;

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.css',
  imports: [
    IconComponent,
    SectionHeaderComponent,
    SkillBadgeComponent,
    SkillFeatureCardComponent,
    SkillsListViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {
  protected skillsData = inject(SkillsDataService);
  private usage = inject(SkillUsageService);
  protected slugify = slugify;

  private readonly media = inject(MediaQueryService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly expandedCategories = signal<Record<string, boolean>>({});
  protected readonly viewMode = signal<ViewMode>('grid');

  /**
   * View-mode toggle options — identical shape + order to
   * `projects.component.ts`'s `viewOptions` so the two toggles stay
   * visually consistent across the site. `list` leads per the
   * site-wide "resting state first" pattern referenced in the
   * Projects component.
   */
  protected readonly viewOptions: readonly {
    key: ViewMode;
    icon: string;
    label: string;
  }[] = [
    { key: 'list', icon: 'list', label: 'List view' },
    { key: 'grid', icon: 'layout-grid', label: 'Grid view' },
  ];

  /**
   * Featured strip content — up to `FEATURE_CAP` curated skills in
   * catalog order. The inclusion filter is `tagline !== undefined` (not
   * `tier === 'core'`) because the strip is a narrative surface: cards
   * with no tagline end up visually empty next to richly-filled peers
   * and break the row's height uniformity. Authors control strip
   * membership by populating `tagline` on the skill in
   * `skills-data.service.ts`.
   *
   * Note on `tier: 'core'` skills without taglines (e.g. Go, Docker,
   * Git, GitHub Copilot, Cursor): they intentionally render as plain
   * uniform tiles in the per-category grid. The "core" signal surfaces
   * in the list view tier pill instead — the grid stays uniform on
   * purpose so a 9-tile category doesn't fracture into a chart of
   * sub-tiers (see `ui-skill-badge` for the uniform-tile rationale).
   */
  protected readonly coreSkills = computed<Skill[]>(() => {
    const out: Skill[] = [];
    for (const cat of this.skillsData.categories()) {
      for (const skill of cat.skills) {
        if (skill.tagline) {
          out.push(skill);
          if (out.length >= FEATURE_CAP) return out;
        }
      }
    }
    return out;
  });

  /**
   * Per-category visible cut, kept in lock-step with the CSS column
   * count in `skills.component.css` so the collapsed grid always
   * resolves to a single uncluttered row — never `N + 1` lonely-tile
   * partials.
   *
   * Desktop / tablet: 5 cols → 5 visible. Mobile (`max-width: 767px`,
   * matches `MOBILE_MAX` in `MediaQueryService`): 3 cols → 3 visible.
   * The feature strip carries the "core" story above, so each
   * category only needs a sampler before the "+ N more" toggle.
   */
  protected readonly visibleLimit = computed(() => (this.media.isMobile() ? 3 : 5));

  /**
   * Per-category truncated skill list, indexed by category title.
   *
   * A plain `visibleSkills(cat)` method (the previous shape) returned a
   * fresh `.slice()` on every change-detection pass for every category
   * in the `@for` — defeating the `@for` differ's identity check and
   * forcing it to re-render every tile every tick. Memoising as a single
   * `computed()` over (`categories`, `visibleLimit`, `expandedCategories`)
   * means each entry's array reference is stable until one of those
   * three signals actually changes.
   */
  protected readonly visibleSkillsByCategory = computed<Map<string, Skill[]>>(() => {
    const limit = this.visibleLimit();
    const expanded = this.expandedCategories();
    const map = new Map<string, Skill[]>();
    for (const cat of this.skillsData.categories()) {
      if (cat.skills.length <= limit || expanded[cat.title]) {
        map.set(cat.title, cat.skills);
      } else {
        map.set(cat.title, cat.skills.slice(0, limit));
      }
    }
    return map;
  });

  protected visibleSkills(category: SkillCategory): Skill[] {
    return this.visibleSkillsByCategory().get(category.title) ?? category.skills;
  }

  protected hiddenCount(category: SkillCategory): number {
    return Math.max(0, category.skills.length - this.visibleLimit());
  }

  protected isExpanded(title: string): boolean {
    return !!this.expandedCategories()[title];
  }

  protected toggleCategory(title: string): void {
    this.expandedCategories.update((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  protected setViewMode(mode: ViewMode): void {
    /*
      Wrap the mode swap in `document.startViewTransition` so the
      `view-transition-name: skills-results` region cross-fades
      between the grid and list subtrees. Same pattern + same
      timing the Projects page already uses for its list↔grid
      toggle (Angular's `withViewTransitions()` handles that one
      via the route navigation; this one is signal-driven so we
      manage the transition ourselves). The two pages now feel
      cohesive across the IDE-tab metaphor.

      Falls back to an instant `viewMode.set` when:
        - the API isn't supported (Firefox <132, older Safari)
        - reduced-motion is on (WCAG 2.3.3)
        - SSR / non-browser rendering
    */
    const supportsViewTransition =
      this.isBrowser &&
      'startViewTransition' in this.document &&
      typeof (this.document as Document & { startViewTransition?: unknown }).startViewTransition ===
        'function';

    if (supportsViewTransition && !prefersReducedMotion()) {
      (
        this.document as Document & { startViewTransition: (cb: () => void) => unknown }
      ).startViewTransition(() => this.viewMode.set(mode));
    } else {
      this.viewMode.set(mode);
    }
  }

  /**
   * Roving tabindex + selection move for the view radiogroup. ARIA's
   * `radiogroup` pattern wants arrow keys to traverse + select; pairs
   * with `[tabindex]` bindings on the buttons so Tab lands on the
   * active option only. Mirrors `ProjectsComponent.onViewKey`.
   */
  protected onViewKey(event: Event, currentIndex: number, dir: -1 | 1): void {
    event.preventDefault();
    const opts = this.viewOptions;
    const next = (currentIndex + dir + opts.length) % opts.length;
    this.setViewMode(opts[next].key);
    const buttons =
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.skills-view-option');
    buttons[next]?.focus();
  }

  protected usageFor(skill: Skill): SkillUsage | undefined {
    return this.usage.usageFor(skill);
  }

  protected projectsHref(usage: SkillUsage | undefined): string | undefined {
    if (!usage?.projectsRouteSlug) return undefined;
    return `/projects/tag/${usage.projectsRouteSlug}`;
  }

  protected postsHref(usage: SkillUsage | undefined): string | undefined {
    if (!usage?.postsRouteSlug) return undefined;
    return `/blog/tag/${usage.postsRouteSlug}`;
  }
}
