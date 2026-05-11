import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { IconComponent } from '@ui/icon/icon.component';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { SkillBadgeComponent } from '@ui/skill-badge/skill-badge.component';
import { SkillsDataService, deriveTier } from '@core/services/skills-data.service';
import { SkillUsageService, SkillUsage } from '@core/services/skill-usage.service';
import { MediaQueryService } from '@core/services/media-query.service';
import { SkillCategory, Skill, SkillTier } from '@shared/models/skill.model';
import { slugify } from '@shared/utils/string.utils';
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

  protected visibleSkills(category: SkillCategory): Skill[] {
    const limit = this.visibleLimit();
    if (category.skills.length <= limit) return category.skills;
    return this.isExpanded(category.title) ? category.skills : category.skills.slice(0, limit);
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
    this.viewMode.set(mode);
  }

  protected usageFor(skill: Skill): SkillUsage | undefined {
    return this.usage.usageFor(skill);
  }

  protected tierFor(skill: Skill, usage: SkillUsage | undefined): SkillTier {
    return deriveTier(skill, usage);
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
