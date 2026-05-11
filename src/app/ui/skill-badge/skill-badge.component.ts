import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Compact skill tile used inside each category grid on `/skills`.
 *
 * The tile is deliberately low-ornament: icon + name + (optional) dim
 * treatment. Every tile occupies the same visual footprint so a full
 * grid reads as a uniform field — in iteration 3 we had tiles with
 * cryptic `1p`/`2b` caption pills that broke the row's bottom-edge
 * alignment and confused first-time readers. Counts now live only on
 * the feature-strip cards and the list view, where there's room to
 * spell them out.
 *
 * Uniform-by-design: tier is deliberately NOT rendered on the tile.
 * Earlier iterations toyed with a red accent border for `tier:
 * 'core'` skills, but with up to nine tiles per row a sub-bar of
 * accented vs. plain tiles read as a noisy mini-chart rather than a
 * grid of capabilities. The tier signal lives on the feature strip
 * (curated narrative) and the list view (the "Core / Working /
 * Learning" pill column).
 *
 * Interaction contract:
 * - `href` makes the entire tile a card-link via a stretched empty
 *   `::after` anchor. Single anchor per target, middle-click / open-
 *   in-new-tab preserved, and the anchor carries an aria-label so
 *   screen readers announce "Python — view 6 projects" even though
 *   the count is not visually rendered.
 * - `[dimmed]=true` drops the tile to 0.62 opacity for learning-tier
 *   skills (0 linked projects). The one allowed variation — everything
 *   else is uniform.
 * - `tagline` surfaces via the native `title` attribute on hover.
 *   Invisible noise until requested, zero layout cost.
 */
@Component({
  selector: 'ui-skill-badge',
  template: `
    <div
      class="badge-inner"
      [class.badge-inner-link]="!!href()"
      [class.dimmed]="dimmed()"
      [attr.title]="tagline() || null"
    >
      @if (iconSrc()) {
        <img [ngSrc]="iconSrc()!" [alt]="name()" width="48" height="48" class="badge-icon" />
      }
      <span class="badge-name">{{ name() }}</span>
      @if (href(); as link) {
        <a class="badge-card-link" [routerLink]="link" [attr.aria-label]="projectsAriaLabel()"></a>
      }
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
   * `routerLink` target for the badge-wide click area — typically
   * `/projects/tag/<slug>`. When omitted, the tile stays a static
   * card. The card-wide click target is an empty stretched anchor.
   */
  href = input<string>();
  /**
   * Used only to build the aria-label for the card-link. The count is
   * no longer rendered visually on the tile — tiles in the grid stay
   * uniform, and the number lives on the feature strip / list view.
   */
  projectsCount = input<number>(0);
  /** Drops the tile to 0.62 opacity for learning-tier (0 projects). */
  dimmed = input<boolean>(false);
  /** Surfaced via the native `title` attribute on hover. */
  tagline = input<string>();

  /**
   * "{name} — view {n} projects" so SR users know the link's target
   * even though the number is visually absent. When count is 0 the
   * label is just the name — matches the tile's non-link state.
   */
  protected projectsAriaLabel = computed(() => {
    const n = this.projectsCount();
    if (n <= 0) return this.name();
    return `${this.name()} — view ${n} ${n === 1 ? 'project' : 'projects'}`;
  });
}
