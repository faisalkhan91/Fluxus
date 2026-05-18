import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { GithubMetaComponent } from '@ui/github-meta/github-meta.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import { Project } from '@shared/models/project.model';
import { slugify } from '@shared/utils/string.utils';
import { assertNever } from '@shared/utils/exhaustive.utils';

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

/**
 * Presentation mode for the projects list. `list` is the default —
 * featured projects render as stacked hero cards with the rest as
 * compact "more work" rows (denser, text-first, scannable). `grid`
 * is opt-in via `?view=grid` and renders the thumbnail card layout.
 * A reader's choice is persisted in the query parameter so refresh
 * + share-links survive.
 */
export type ProjectView = 'grid' | 'list';

const ALLOWED_VIEWS: readonly ProjectView[] = ['grid', 'list'];
const DEFAULT_VIEW: ProjectView = 'list';

/** Coerce a GitHub `pushedAt` ISO string to a sortable timestamp;
 *  missing or malformed values fall to 0 so they sort to the bottom. */
function parsePushedAt(pushedAt: string | null | undefined): number {
  if (!pushedAt) return 0;
  const ms = Date.parse(pushedAt);
  return Number.isFinite(ms) ? ms : 0;
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
  imports: [
    NgOptimizedImage,
    RouterLink,
    SectionHeaderComponent,
    GlassCardComponent,
    IconComponent,
    GithubMetaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  protected projectsData = inject(ProjectsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
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
    // Capture the signal value in a local so TypeScript can narrow it
    // across cases and recognise it as `never` in the default arm —
    // calling `this.sort()` again would defeat the narrowing because
    // signals are opaque to flow analysis.
    const mode = this.sort();
    switch (mode) {
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
          // `Date.parse` returns NaN for malformed strings; without an
          // explicit isNaN check `(NaN - 0)` is NaN, which is *neither*
          // `> 0` nor `< 0`, leaving JS's stable sort to float the bad
          // entry to an unpredictable position. Coerce missing/invalid
          // dates to 0 so they sort to the bottom (and ties fall through
          // to the featured tiebreak).
          const ta = parsePushedAt(a.github?.pushedAt);
          const tb = parsePushedAt(b.github?.pushedAt);
          if (tb !== ta) return tb - ta;
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        });
      case 'featured':
        return base;
      default:
        // Exhaustive guard: a future ProjectSort value added to the
        // union surfaces here as a compile error so the switch can't
        // silently fall through to the catalog order.
        return assertNever(mode);
    }
  });

  protected readonly sortOptions: readonly { key: ProjectSort; label: string }[] = [
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

  /** Query-driven view mode, defaulting to `list` when absent or invalid. */
  protected readonly view = toSignal(
    this.route.queryParamMap.pipe(
      map((q): ProjectView => {
        const raw = (q.get('view') ?? '').toLowerCase() as ProjectView;
        return ALLOWED_VIEWS.includes(raw) ? raw : DEFAULT_VIEW;
      }),
    ),
    { initialValue: DEFAULT_VIEW },
  );

  /**
   * Featured projects in `visibleProjects()` order. Renders as the
   * hero cards atop the list view. `grid` view ignores the split.
   */
  protected readonly featuredProjects = computed<Project[]>(() =>
    this.visibleProjects().filter((p) => p.featured),
  );

  /**
   * Non-featured projects — the "More work" bucket under the list
   * view. Sort order matches `visibleProjects()`, so switching to
   * `?sort=stars` reorders the compact rows the same way it reorders
   * the grid.
   */
  protected readonly moreProjects = computed<Project[]>(() =>
    this.visibleProjects().filter((p) => !p.featured),
  );

  protected readonly viewOptions: readonly {
    key: ProjectView;
    icon: string;
    label: string;
  }[] = [
    // `list` is the default view, so it leads the toggle — matches the
    // left-to-right "resting state first" pattern used elsewhere in the
    // app's view switchers.
    { key: 'list', icon: 'list', label: 'List view' },
    { key: 'grid', icon: 'layout-grid', label: 'Grid view' },
  ];

  protected setView(key: ProjectView): void {
    this.router.navigate([], {
      relativeTo: this.route,
      // `list` is the default — scrub the query param when selecting it
      // so the URL stays clean. `grid` sticks.
      queryParams: { view: key === DEFAULT_VIEW ? null : key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /**
   * Roving tabindex + selection move for the sort radiogroup. ARIA's
   * `radiogroup` pattern wants arrow keys (not Tab) to traverse the
   * options, with the focused option becoming the new selection. We
   * `.focus()` the next button explicitly even though its tabindex
   * is `-1` until the next render — `.focus()` ignores tabindex and
   * the attribute will catch up on the next change-detection pass.
   */
  protected onSortKey(event: Event, currentIndex: number, dir: -1 | 1): void {
    event.preventDefault();
    const opts = this.sortOptions;
    const next = (currentIndex + dir + opts.length) % opts.length;
    this.setSort(opts[next].key);
    const buttons = this.host.nativeElement.querySelectorAll<HTMLButtonElement>(
      '.projects-sort-option',
    );
    buttons[next]?.focus();
  }

  /** Roving tabindex + selection move for the view radiogroup. */
  protected onViewKey(event: Event, currentIndex: number, dir: -1 | 1): void {
    event.preventDefault();
    const opts = this.viewOptions;
    const next = (currentIndex + dir + opts.length) % opts.length;
    this.setView(opts[next].key);
    const buttons = this.host.nativeElement.querySelectorAll<HTMLButtonElement>(
      '.projects-view-option',
    );
    buttons[next]?.focus();
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
}
