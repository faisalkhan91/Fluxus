import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Compact skill tile used inside each category grid on `/skills`.
 *
 * Every tile reads as a uniform field of icon + name at rest — the
 * pill counts that previously sat at the footer have been moved
 * behind a hover / focus / touch reveal so a row of mixed-usage
 * skills can no longer let two-pill cards stretch zero-pill peers
 * via `align-items: stretch`. The captions wrapper is still rendered
 * in the DOM, with a reserved `min-height`, so the reveal is a pure
 * opacity tween with zero layout shift. No tier-driven opacity or
 * border accents; the "core" story is carried by the feature strip
 * above the grids, and the detailed tier breakdown lives on the list
 * view.
 *
 * Interaction contract:
 * - When `href` is set, the projects caption becomes the anchor that
 *   owns a stretched `::after` overlay — the whole tile is clickable,
 *   middle-click / open-in-new-tab preserved, no nested anchors. The
 *   overlay stays hit-testable when the pill is invisible at rest
 *   (`opacity: 0` does not block pointer events), so the click-through
 *   contract is independent of the reveal state.
 * - When `postsHref` is set and `postsCount > 0`, the posts pill is a
 *   sibling anchor with its own `z-index: 1` so it remains clickable
 *   on top of the card overlay once revealed.
 * - The captions wrapper is always rendered, even when both counts
 *   are 0, so tiles without mapped usage still share the same
 *   internal rhythm as peers that have pills. `min-height` on the
 *   wrapper reserves the footer slot whether the row is empty,
 *   invisible, or fully populated.
 * - `tagline` surfaces via the native `title` attribute on hover —
 *   invisible noise until requested, zero layout cost.
 */
@Component({
  selector: 'ui-skill-badge',
  template: `
    <div class="badge-inner" [class.badge-inner-link]="!!href()" [attr.title]="tagline() || null">
      @if (iconSrc()) {
        <img
          [ngSrc]="iconSrc()!"
          [alt]="name()"
          width="48"
          height="48"
          class="badge-icon"
          [class.badge-icon--mono]="mono()"
        />
      }
      <span class="badge-name">{{ name() }}</span>
      <div class="badge-captions">
        @if (projectsCount() > 0) {
          @if (href(); as link) {
            <a
              class="badge-caption badge-caption-link badge-card-link"
              [routerLink]="link"
              [attr.aria-label]="projectsAriaLabel()"
            >
              {{ projectsCount() }} {{ projectsCount() === 1 ? 'project' : 'projects' }}
            </a>
          } @else {
            <span class="badge-caption">
              {{ projectsCount() }} {{ projectsCount() === 1 ? 'project' : 'projects' }}
            </span>
          }
        }
        @if (postsCount() > 0) {
          @if (postsHref(); as plink) {
            <a
              class="badge-caption badge-caption-link"
              [routerLink]="plink"
              [attr.aria-label]="postsAriaLabel()"
            >
              {{ postsCount() }} {{ postsCount() === 1 ? 'post' : 'posts' }}
            </a>
          } @else {
            <span class="badge-caption">
              {{ postsCount() }} {{ postsCount() === 1 ? 'post' : 'posts' }}
            </span>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './skill-badge.component.css',
  imports: [NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillBadgeComponent {
  name = input.required<string>();
  iconSrc = input<string>();
  /**
   * `routerLink` target for the card-wide click area — typically
   * `/projects/tag/<slug>`. When omitted, the tile stays a static
   * card with no interactive affordance. The click overlay is a
   * stretched `::after` on the projects-caption anchor, so we never
   * nest anchors.
   */
  href = input<string>();
  /** Renders the "N projects" caption pill when > 0. */
  projectsCount = input<number>(0);
  /** Renders the "M posts" caption pill when > 0. */
  postsCount = input<number>(0);
  /**
   * Optional `routerLink` for the posts caption pill — typically
   * `/blog/tag/<slug>`. When omitted, the count renders as plain text.
   */
  postsHref = input<string>();
  /** Surfaced via the native `title` attribute on hover. */
  tagline = input<string>();
  /**
   * When true, applies the `--icon-mono-filter` CSS token to the icon
   * so single-colour brand SVGs (Kafka, Cursor, Splunk, …) stay
   * visible against dark surfaces. The token is `none` on light
   * themes so coloured logos are never touched.
   */
  mono = input<boolean>(false);

  protected projectsAriaLabel = computed(() => {
    const n = this.projectsCount();
    return `${this.name()} — view ${n} ${n === 1 ? 'project' : 'projects'}`;
  });

  protected postsAriaLabel = computed(() => {
    const n = this.postsCount();
    return `${n} ${n === 1 ? 'post' : 'posts'} tagged ${this.name()}`;
  });
}
