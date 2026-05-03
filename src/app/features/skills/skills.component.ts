import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { SkillBadgeComponent } from '@ui/skill-badge/skill-badge.component';
import { SkillsDataService } from '@core/services/skills-data.service';
import { SkillUsageService, SkillUsage } from '@core/services/skill-usage.service';
import { MediaQueryService } from '@core/services/media-query.service';
import { SkillCategory, Skill } from '@shared/models/skill.model';
import { slugify } from '@shared/utils/string.utils';

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.css',
  imports: [SectionHeaderComponent, SkillBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {
  protected skillsData = inject(SkillsDataService);
  private usage = inject(SkillUsageService);
  protected slugify = slugify;

  private readonly media = inject(MediaQueryService);
  private readonly expandedCategories = signal<Record<string, boolean>>({});

  protected readonly topN = computed(() => (this.media.isMobile() ? 3 : 5));

  protected visibleSkills(category: SkillCategory): Skill[] {
    const n = this.topN();
    if (category.skills.length <= n) return category.skills;
    return this.isExpanded(category.title) ? category.skills : category.skills.slice(0, n);
  }

  protected isExpanded(title: string): boolean {
    return !!this.expandedCategories()[title];
  }

  protected toggleCategory(title: string): void {
    this.expandedCategories.update((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }

  protected hiddenCount(category: SkillCategory): number {
    return Math.max(0, category.skills.length - this.topN());
  }

  /**
   * Per-skill backlink resolution. The template asks once per badge and
   * downstream `[href]` / `[postsHref]` / `[*Count]` bindings consume the
   * same record, so we don't pay for repeated lookups.
   *
   * Returns `undefined` when the skill is unknown to the registry — the
   * badge then renders as a static, non-interactive card.
   */
  protected usageFor(skill: Skill): SkillUsage | undefined {
    return this.usage.usageFor(skill);
  }

  /** Convenience for the template: `/projects/tag/<routeSlug>` or null. */
  protected projectsHref(usage: SkillUsage | undefined): string | undefined {
    if (!usage?.projectsRouteSlug) return undefined;
    return `/projects/tag/${usage.projectsRouteSlug}`;
  }

  protected postsHref(usage: SkillUsage | undefined): string | undefined {
    if (!usage?.postsRouteSlug) return undefined;
    return `/blog/tag/${usage.postsRouteSlug}`;
  }
}
