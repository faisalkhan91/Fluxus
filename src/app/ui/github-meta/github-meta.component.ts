import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { GithubMeta } from '@shared/models/project.model';
import {
  compactNumber,
  languagesBarLabel,
  languagesPercent,
  relativeTime,
} from '@shared/utils/github-format.utils';

/**
 * Renders the standardised GitHub metadata row for a project:
 *   primary language · latest release · live demo · stars · forks ·
 *   open issues (optional) · last pushed · license
 * plus an optional language-distribution bar underneath.
 *
 * Consumed by the `/projects` card (dense variant) and the
 * `/projects/:slug` detail page (roomier variant). Callers control
 * sizing via CSS custom properties exposed on the host:
 *   `--gh-pill-font-size` (default 0.65rem)
 *   `--gh-languages-bar-height` (default 4px)
 * and toggle the "open issues" pill with `[showOpenIssues]`, which
 * the detail surface turns on but the card keeps off to preserve
 * visual density.
 *
 * When `meta()` is `undefined` the component renders nothing — the
 * parent can place it inside a `@if (project.github)` guard or leave
 * the component mounted unconditionally and let it self-hide.
 */
@Component({
  selector: 'ui-github-meta',
  templateUrl: './github-meta.component.html',
  styleUrl: './github-meta.component.css',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GithubMetaComponent {
  /** GitHub data block. Renders nothing when undefined. */
  readonly meta = input<GithubMeta | undefined>(undefined);
  /** Human-readable project title, used in the row's aria-label. */
  readonly projectTitle = input<string>('');
  /**
   * Whether to render the "N open issues" pill. The project grid
   * omits it to keep the card dense; the detail page shows it.
   */
  readonly showOpenIssues = input<boolean>(false);

  protected readonly rel = computed(() => this.meta()?.latestRelease ?? null);
  protected readonly languages = computed(() => this.meta()?.languagesBytes ?? []);
  protected readonly pushedRelative = computed(() => relativeTime(this.meta()?.pushedAt));
  protected readonly releaseRelative = computed(() =>
    this.rel() ? relativeTime(this.rel()!.publishedAt) : '',
  );
  protected readonly starsCompact = computed(() => compactNumber(this.meta()?.stars));
  protected readonly forksCompact = computed(() => compactNumber(this.meta()?.forks));
  protected readonly languagesLabel = computed(() => languagesBarLabel(this.languages()));

  /** Template helper — percent for a given segment by name. */
  protected percentOf(name: string): string {
    return languagesPercent(this.languages(), name);
  }
}
