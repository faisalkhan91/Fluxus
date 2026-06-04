import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SectionHeaderComponent } from '@ui/section-header/section-header.component';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { TagComponent } from '@ui/tag/tag.component';
import { GithubMetaComponent } from '@ui/github-meta/github-meta.component';
import { ProjectsDataService } from '@core/services/projects-data.service';
import type { Project } from '@shared/models/project.model';
import { slugify } from '@shared/utils/string.utils';
import { assertNever } from '@shared/utils/exhaustive.utils';
import { createExpandableSet } from '@shared/utils/expandable-set';
import { rovingNext, focusByIndex } from '@shared/utils/roving.utils';
import { queryParamSignal, setQueryParam } from '@shared/utils/query-param.utils';

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

/** Featured-first tiebreak for the `stars`/`updated` sorts when values tie. */
function featuredTiebreak(a: Project, b: Project): number {
  return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
}

function byAlpha(a: Project, b: Project): number {
  return a.title.localeCompare(b.title);
}

function byStars(a: Project, b: Project): number {
  const sa = a.github?.stars ?? -1;
  const sb = b.github?.stars ?? -1;
  return sb !== sa ? sb - sa : featuredTiebreak(a, b);
}

function byUpdated(a: Project, b: Project): number {
  // `parsePushedAt` coerces missing/invalid dates to 0 so they sort to the
  // bottom (and ties fall through to the featured tiebreak) — without it a
  // NaN comparison would float a malformed entry to an unpredictable spot.
  const ta = parsePushedAt(a.github?.pushedAt);
  const tb = parsePushedAt(b.github?.pushedAt);
  return tb !== ta ? tb - ta : featuredTiebreak(a, b);
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
    TagComponent,
    GithubMetaComponent,
  ],
})
export class ProjectsComponent {
  protected projectsData = inject(ProjectsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected slugify = slugify;

  /*
    Sliding active-sort indicator. Mirrors the pattern in
    `editor-tab-bar.component.ts` so the IDE-tab metaphor is
    consistent across the app: a single 2 px bar that translates +
    resizes between the active sort chip's `offsetLeft` /
    `offsetWidth`. The component sets `--sort-indicator-x` /
    `--sort-indicator-width` on the row; CSS does the slide via
    `--transition-tab` (120 ms). When no chip is active (initial
    SSR render before signal hydrates), `width: 0` keeps the bar
    hidden — matches the tab-bar contract.
  */
  protected readonly sortIndicatorX = signal(0);
  protected readonly sortIndicatorWidth = signal(0);
  protected readonly sortRow = viewChild<ElementRef<HTMLElement>>('sortRow');

  private readonly expanded = createExpandableSet();

  /** Query-driven sort key, defaulting to `featured` when absent or invalid. */
  protected readonly sort = queryParamSignal(this.route, 'sort', ALLOWED_SORTS, 'featured');

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
        return base.sort(byAlpha);
      case 'stars':
        return base.sort(byStars);
      case 'updated':
        return base.sort(byUpdated);
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

  constructor() {
    /*
      Recompute the sliding-indicator position whenever the active
      sort changes. Wrapped in `queueMicrotask` so the new
      `.projects-sort-option.active` class has actually painted before
      we read `offsetLeft` / `offsetWidth` — otherwise the first
      paint reads stale geometry from the previous active chip.
      Browser-only so SSR doesn't try to read DOM offsets.
    */
    effect(() => {
      this.sort();
      if (this.isBrowser) {
        queueMicrotask(() => this.updateSortIndicator());
      }
    });

    afterNextRender(() => {
      // Initial pass once the view has been committed and the row's
      // geometry is real. Layout shifts (e.g. font-loading, viewport
      // resize) re-fire via the listener below.
      this.updateSortIndicator();

      const onResize = () => this.updateSortIndicator();
      window.addEventListener('resize', onResize, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
    });
  }

  /**
   * Read the active chip's `offsetLeft` + `offsetWidth` and publish
   * them as CSS custom properties on the row. The CSS `::after`
   * pseudo (see `projects.component.css`) reads those vars and
   * slides via `--transition-tab`. No-op when the row hasn't
   * mounted (initial render path) or no chip is active — sets
   * width to 0 so the indicator stays hidden until valid geometry
   * arrives. Mirrors `EditorTabBarComponent.updateIndicator`.
   */
  private updateSortIndicator(): void {
    const row = this.sortRow()?.nativeElement;
    if (!row) return;
    const active = row.querySelector<HTMLElement>('.projects-sort-option.active');
    if (!active) {
      this.sortIndicatorWidth.set(0);
      return;
    }
    this.sortIndicatorX.set(active.offsetLeft);
    this.sortIndicatorWidth.set(active.offsetWidth);
  }

  protected setSort(key: ProjectSort): void {
    // `featured` is the default, so scrub the param rather than leaving
    // `?sort=featured` dangling; every other value sticks for refresh /
    // share-link survival.
    setQueryParam(this.router, this.route, 'sort', key === 'featured' ? null : key);
  }

  /** Query-driven view mode, defaulting to `list` when absent or invalid. */
  protected readonly view = queryParamSignal(this.route, 'view', ALLOWED_VIEWS, DEFAULT_VIEW);

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
    // `list` is the default — scrub the param when selecting it so the URL
    // stays clean; `grid` sticks.
    setQueryParam(this.router, this.route, 'view', key === DEFAULT_VIEW ? null : key);
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
    const next = rovingNext(currentIndex, dir, this.sortOptions.length);
    this.setSort(this.sortOptions[next].key);
    focusByIndex(this.host.nativeElement, '.projects-sort-option', next);
  }

  /** Roving tabindex + selection move for the view radiogroup. */
  protected onViewKey(event: Event, currentIndex: number, dir: -1 | 1): void {
    event.preventDefault();
    const next = rovingNext(currentIndex, dir, this.viewOptions.length);
    this.setView(this.viewOptions[next].key);
    focusByIndex(this.host.nativeElement, '.projects-view-option', next);
  }

  protected isExpanded = this.expanded.isExpanded;
  protected toggleExpand = this.expanded.toggle;
}
