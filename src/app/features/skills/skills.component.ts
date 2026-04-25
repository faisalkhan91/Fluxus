import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { SkillBadgeComponent } from '@ui/skill-badge/skill-badge.component';
import { SkillsDataService } from '@core/services/skills-data.service';
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
}
