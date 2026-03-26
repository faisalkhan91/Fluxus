import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SectionHeaderComponent } from '../../ui/section-header/section-header.component';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { ProjectsDataService } from '../../core/services/projects-data.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
  imports: [NgOptimizedImage, SectionHeaderComponent, GlassCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  protected projectsData = inject(ProjectsDataService);
}
