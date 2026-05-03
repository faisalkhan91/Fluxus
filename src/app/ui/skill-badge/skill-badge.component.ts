import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * IDE-themed pill that represents one skill on `/skills`.
 *
 * Rendering rules:
 * - `iconSrc` (optional) and `name` (required) are always shown.
 * - `level` (optional) renders the existing under-bar with proper
 *   `role="progressbar"` semantics. Reserved for the lead skills per
 *   category so the page hints at depth without becoming a chart.
 * - When `href` is set, the badge becomes a "card link": the projects
 *   anchor is inside the card and uses a stretched ::after overlay so
 *   the entire card area is clickable / middle-clickable. The whole
 *   tile keeps the same visual treatment as the static badge.
 * - When `postsCount > 0`, a small "M posts" pill renders. If
 *   `postsHref` is also set the pill is its own anchor (sibling to the
 *   card link, sitting above the overlay via z-index). Anchors are
 *   never nested — the card-link uses ::after, the posts pill uses a
 *   normal anchor on top.
 *
 * The "N projects" pill (always rendered when `projectsCount > 0`)
 * doubles as the visible label for the card-wide link, so screen
 * readers announce a meaningful "Rust — view 3 projects" instead of
 * an icon-only target.
 */
@Component({
  selector: 'ui-skill-badge',
  template: `
    <div class="badge-inner" [class.badge-inner-link]="!!href()">
      @if (iconSrc()) {
        <img [ngSrc]="iconSrc()!" [alt]="name()" width="40" height="40" class="badge-icon" />
      }
      <span class="badge-name">{{ name() }}</span>
      @if (level()) {
        <div
          class="badge-bar"
          role="progressbar"
          [attr.aria-label]="name() + ' proficiency'"
          [attr.aria-valuenow]="level()"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="badge-fill" [style.--badge-fill-scale]="level()! / 100"></div>
        </div>
      }
      @if (hasCaptions()) {
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
  level = input<number>();
  /**
   * `routerLink` target for the badge-wide click area — typically
   * `/projects/tag/<slug>`. When omitted, the badge stays a static card.
   * The card-wide click target is implemented via a stretched ::after
   * pseudo-element on the projects-caption anchor (no nested anchors).
   */
  href = input<string>();
  /** Renders the "N projects" caption pill when > 0. */
  projectsCount = input<number>(0);
  /** Renders the "M posts" caption pill when > 0. */
  postsCount = input<number>(0);
  /**
   * Optional `routerLink` for the "M posts" caption pill — typically
   * `/blog/tag/<slug>`. Omitted means we render the count as plain text.
   */
  postsHref = input<string>();

  protected hasCaptions = computed(() => this.projectsCount() > 0 || this.postsCount() > 0);

  /**
   * SR-friendly label for the card-wide projects link. Reads as
   * "Rust — view 3 projects" so the user knows what they'll land on.
   */
  protected projectsAriaLabel = computed(() => {
    const n = this.projectsCount();
    return `${this.name()} — view ${n} ${n === 1 ? 'project' : 'projects'}`;
  });

  protected postsAriaLabel = computed(() => {
    const n = this.postsCount();
    return `${n} ${n === 1 ? 'post' : 'posts'} tagged ${this.name()}`;
  });
}
