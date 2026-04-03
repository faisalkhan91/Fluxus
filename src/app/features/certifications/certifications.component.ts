import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SectionHeaderComponent } from '../../ui/section-header/section-header.component';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { CertificationsDataService } from '../../core/services/certifications-data.service';

@Component({
  selector: 'app-certifications',
  templateUrl: './certifications.component.html',
  styleUrl: './certifications.component.css',
  imports: [NgOptimizedImage, SectionHeaderComponent, GlassCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificationsComponent {
  protected certsData = inject(CertificationsDataService);
  protected expandedProvider = signal<string | null>(null);

  toggleProvider(name: string): void {
    this.expandedProvider.update((current) => (current === name ? null : name));
  }
}
