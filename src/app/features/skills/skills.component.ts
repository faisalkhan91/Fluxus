import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SectionHeaderComponent } from '../../ui/section-header/section-header.component';
import { SkillBadgeComponent } from '../../ui/skill-badge/skill-badge.component';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';
import { SkillsDataService } from '../../core/services/skills-data.service';
import { slugify } from '../../shared/utils/string.utils';

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.css',
  imports: [SectionHeaderComponent, SkillBadgeComponent, GlassCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {
  protected skillsData = inject(SkillsDataService);
  protected slugify = slugify;
}
