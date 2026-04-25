import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { TimelineComponent, TimelineEntry } from '@ui/timeline/timeline.component';
import { ExperienceDataService } from '@core/services/experience-data.service';

@Component({
  selector: 'app-experience',
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css',
  imports: [SectionHeaderComponent, TimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceComponent {
  private experienceData = inject(ExperienceDataService);

  protected timelineEntries = computed<TimelineEntry[]>(() =>
    this.experienceData.items().map((item) => ({
      type: item.type === 'period' ? ('period' as const) : ('item' as const),
      title: item.title,
      subtitle: item.role,
      duration: item.duration,
      details: item.achievements,
    })),
  );
}
