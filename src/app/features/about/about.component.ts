import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';
import { SectionHeaderComponent } from '../../ui/section-header/section-header.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { ProfileDataService } from '../../core/services/profile-data.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
  imports: [NgOptimizedImage, GlassCardComponent, SectionHeaderComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected profile = inject(ProfileDataService);
}
