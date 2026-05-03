import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { slugify } from '@shared/utils/string.utils';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
  imports: [NgOptimizedImage, RouterLink, SectionHeaderComponent, GlassCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  protected projectsData = inject(ProjectsDataService);
  protected slugify = slugify;

  private expandedSet = signal(new Set<string>());

  protected isExpanded(title: string): boolean {
    return this.expandedSet().has(title);
  }

  protected toggleExpand(title: string): void {
    this.expandedSet.update((set) => {
      const next = new Set(set);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }

  /**
   * Human-readable "last pushed" pill value. Anything older than ~a
   * year falls back to the year ("Updated 2023"), keeping the short
   * fixed-width shape that fits alongside stars / forks / language
   * without wrapping. Returns `''` when the input is missing or
   * unparseable — the template hides the clock pill in that case.
   */
  protected relativeTime(iso: string | null | undefined): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const days = Math.floor(diff / 86_400_000);
    if (days < 1) return 'today';
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const year = new Date(iso).getUTCFullYear();
    return String(year);
  }

  /**
   * Short "127" / "1.2k" / "12k" formatter for star & fork counts.
   * Keeps the pill compact no matter the scale.
   */
  protected compactNumber(value: number | null | undefined): string {
    if (value == null) return '';
    if (value < 1000) return String(value);
    if (value < 10_000) return `${(value / 1000).toFixed(1)}k`;
    return `${Math.round(value / 1000)}k`;
  }
}
