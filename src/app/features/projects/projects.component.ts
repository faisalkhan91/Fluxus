import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { Project } from '@shared/models/project.model';
import { slugify } from '@shared/utils/string.utils';

/**
 * Sort key for the projects grid. Mirrored in the `?sort=` query
 * parameter so a sort choice survives refresh and can be shared.
 * `featured` is the default: preserves the curator's ordering (featured
 * projects glow, then everything else in source order). The remaining
 * keys reorder derived from GitHub metadata and degrade gracefully when
 * a project has no `github` block — missing values sort to the end.
 */
export type ProjectSort = 'featured' | 'alpha' | 'stars' | 'updated';

const ALLOWED_SORTS: readonly ProjectSort[] = ['featured', 'alpha', 'stars', 'updated'];

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
  imports: [NgOptimizedImage, RouterLink, SectionHeaderComponent, GlassCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  protected projectsData = inject(ProjectsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected slugify = slugify;

  private expandedSet = signal(new Set<string>());

  /** Query-driven sort key, defaulting to `featured` when absent or invalid. */
  protected readonly sort = toSignal(
    this.route.queryParamMap.pipe(
      map((q): ProjectSort => {
        const raw = (q.get('sort') ?? '').toLowerCase() as ProjectSort;
        return ALLOWED_SORTS.includes(raw) ? raw : 'featured';
      }),
    ),
    { initialValue: 'featured' as ProjectSort },
  );

  /**
   * Projects re-ordered according to `sort`. `featured` keeps catalog
   * order (same as before). `alpha` uses `localeCompare`. `stars` and
   * `updated` are stable: missing values fall through to a featured-
   * order fallback so the grid never looks shuffled on a cold cache.
   */
  protected readonly visibleProjects = computed<Project[]>(() => {
    const base = [...this.projectsData.projects()];
    switch (this.sort()) {
      case 'alpha':
        return base.sort((a, b) => a.title.localeCompare(b.title));
      case 'stars':
        return base.sort((a, b) => {
          const sa = a.github?.stars ?? -1;
          const sb = b.github?.stars ?? -1;
          if (sb !== sa) return sb - sa;
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        });
      case 'updated':
        return base.sort((a, b) => {
          const ta = a.github?.pushedAt ? Date.parse(a.github.pushedAt) : 0;
          const tb = b.github?.pushedAt ? Date.parse(b.github.pushedAt) : 0;
          if (tb !== ta) return tb - ta;
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        });
      case 'featured':
      default:
        return base;
    }
  });

  protected readonly sortOptions: ReadonlyArray<{ key: ProjectSort; label: string }> = [
    { key: 'featured', label: 'Featured' },
    { key: 'alpha', label: 'A–Z' },
    { key: 'stars', label: 'Most starred' },
    { key: 'updated', label: 'Recently updated' },
  ];

  protected setSort(key: ProjectSort): void {
    this.router.navigate([], {
      relativeTo: this.route,
      // `featured` is the default so we scrub the query param rather than
      // leaving `?sort=featured` dangling in the URL; every other value
      // sticks so refresh + share-link survive.
      queryParams: { sort: key === 'featured' ? null : key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

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

  protected relativeTime(iso: string | null | undefined): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const diff = Math.max(0, Date.now() - then);
    const days = Math.floor(diff / 86_400_000);
    if (days < 1) return 'today';
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return String(new Date(iso).getUTCFullYear());
  }

  protected compactNumber(value: number | null | undefined): string {
    if (value == null) return '';
    if (value < 1000) return String(value);
    if (value < 10_000) return `${(value / 1000).toFixed(1)}k`;
    return `${Math.round(value / 1000)}k`;
  }
}
