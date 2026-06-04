import { Component, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Rich "featured" card used in the `// core stack` strip above the
 * per-category grids on `/skills`. Renders the full hero affordance
 * (large icon, display-font name, tagline, since chip, projects link)
 * for the five skills that `/skills` wants to surface as headline depth.
 *
 * Kept separate from `ui-skill-badge` on purpose:
 *
 * - The badge is a compact tile tuned for a dense grid where every
 *   variant pays in vertical rhythm. Packing hero logic back into it
 *   (as we did in iteration one) conflated two use cases and produced
 *   a grid with ragged empty cells around 2×2 heroes.
 * - This card runs its own flex-grow layout, its own typography
 *   scale, and its own side-scroll behaviour on mobile. None of that
 *   belongs inside a grid-item component.
 *
 * Card-link pattern matches the badge: stretched `::after` on the
 * projects anchor — single interactive zone, middle-click preserved.
 *
 * Footer pills follow the same hover-reveal contract as
 * `ui-skill-badge`'s `.badge-captions` — invisible at rest, fade in
 * on hover / focus-within / touch — so the feature strip's
 * `grid-auto-rows: 1fr` doesn't let a two-pill card (e.g. TypeScript)
 * stretch a zero-pill peer (e.g. Go) into a much taller silhouette.
 */
@Component({
  selector: 'app-skill-feature-card',
  template: `
    <article class="feature-card" [class.feature-card-link]="!!href()">
      <header class="feature-head">
        @if (iconSrc()) {
          <img
            [ngSrc]="iconSrc()!"
            [alt]="name()"
            width="56"
            height="56"
            class="feature-icon"
            [class.feature-icon--mono]="mono()"
          />
        }
        <div class="feature-title-block">
          <h3 class="feature-name">{{ name() }}</h3>
          @if (since(); as s) {
            <span class="feature-since">since {{ s }}</span>
          }
        </div>
      </header>

      @if (tagline()) {
        <p class="feature-tagline">{{ tagline() }}</p>
      }

      <footer class="feature-foot">
        @if (projectsCount() > 0) {
          @if (href(); as link) {
            <a
              class="feature-link feature-card-anchor"
              [routerLink]="link"
              [attr.aria-label]="projectsAriaLabel()"
            >
              {{ projectsCount() }} {{ projectsCount() === 1 ? 'project' : 'projects' }} →
            </a>
          } @else {
            <span class="feature-count">
              {{ projectsCount() }} {{ projectsCount() === 1 ? 'project' : 'projects' }}
            </span>
          }
        }
        @if (postsCount() > 0) {
          @if (postsHref(); as plink) {
            <a
              class="feature-link feature-posts"
              [routerLink]="plink"
              [attr.aria-label]="postsAriaLabel()"
            >
              {{ postsCount() }} {{ postsCount() === 1 ? 'post' : 'posts' }}
            </a>
          } @else {
            <span class="feature-count feature-posts">
              {{ postsCount() }} {{ postsCount() === 1 ? 'post' : 'posts' }}
            </span>
          }
        }
      </footer>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        /* The strip container sets track widths via CSS grid. This
           keeps cards equal-width at rest on desktop and equal-minmax
           on mobile's scroll rail. */
        min-width: 0;
        height: 100%;
      }

      .feature-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-5);
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        height: 100%;
        box-sizing: border-box;
        transition:
          background-color var(--transition-base),
          border-color var(--transition-base),
          transform var(--transition-base);
      }

      .feature-card:hover {
        background: var(--glass-bg-hover);
        border-color: var(--accent);
        transform: translateY(-2px);
      }

      .feature-card-link {
        position: relative;
      }

      .feature-card-link:focus-within {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
      }

      .feature-head {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .feature-icon {
        width: 56px;
        height: 56px;
        object-fit: contain;
        filter: var(--icon-drop-shadow);
        flex-shrink: 0;
        /* Per-icon filter overrides for brand assets that vanish
           under one polarity (e.g. dark Cursor on dark themes, light
           TypeScript on light themes) live in src/styles.css under
           the "Skill-icon filter overrides" block and apply globally
           to every skill img. */
      }

      /* Single-colour monochrome icons (Kafka, Cursor, Splunk, …)
         vanish against dark surfaces because their fills are
         near-black. The --icon-mono-filter token is 'none' on light
         themes and an invert() on dark themes (defined in styles.css). */
      .feature-icon--mono {
        filter: var(--icon-mono-filter, none);
      }

      .feature-title-block {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        min-width: 0;
      }

      .feature-name {
        font-family: var(--font-display);
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: -0.01em;
        margin: 0;
        line-height: 1.2;
      }

      .feature-since {
        font-family: var(--font-mono);
        font-size: 0.7rem;
        color: var(--text-muted);
        letter-spacing: 0.04em;
      }

      .feature-tagline {
        font-family: var(--font-body);
        font-size: 0.85rem;
        line-height: 1.45;
        color: var(--text-secondary);
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .feature-foot {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: var(--space-3);
        margin-top: auto;
        padding-top: var(--space-1);
        /* Reserve a consistent slot for the projects / posts line so
           cards with zero linked work still align along the same
           footer y-position as their peers that do. Matches the
           padding-bottom + line-height of a single pill. */
        min-height: 1.25rem;
        /* Hidden at rest, revealed on hover / focus-within — same
           contract as ui-skill-badge's .badge-captions row. The
           feature strip uses grid-auto-rows: 1fr, so the tallest
           card dictates row height; collapsing the resting visual
           variance to zero keeps every card in a row equal-height
           regardless of how many of them carry counts. */
        opacity: 0;
        transition: opacity var(--transition-base);
      }

      .feature-card:hover .feature-foot,
      .feature-card:focus-within .feature-foot {
        opacity: 1;
      }

      @media (hover: none) {
        .feature-foot {
          opacity: 1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .feature-foot {
          transition: none;
        }
      }

      .feature-link {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-decoration: none;
        position: relative;
        z-index: 1;
        transition: color var(--transition-base);
      }

      .feature-count {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .feature-link:hover,
      .feature-link:focus-visible {
        color: var(--accent);
      }

      .feature-link:focus-visible {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
      }

      .feature-posts {
        color: var(--text-muted);
      }

      /* Card-link overlay: stretched ::after on the projects anchor so
         the whole card routes on click. Posts anchor sits above via its
         own z-index so it remains individually clickable. */
      .feature-card-anchor::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        z-index: 0;
      }

      .feature-card-anchor:focus-visible {
        outline: none;
      }
    `,
  ],
  imports: [NgOptimizedImage, RouterLink],
})
export class SkillFeatureCardComponent {
  readonly name = input.required<string>();
  readonly iconSrc = input<string>();
  readonly tagline = input<string>();
  readonly since = input<number>();
  readonly href = input<string>();
  readonly projectsCount = input<number>(0);
  readonly postsCount = input<number>(0);
  readonly postsHref = input<string>();
  /**
   * When true, applies `--icon-mono-filter` to the icon so single-colour
   * brand SVGs stay visible on dark themes. See `Skill.mono`.
   */
  readonly mono = input<boolean>(false);

  protected readonly projectsAriaLabel = computed(() => {
    const n = this.projectsCount();
    return `${this.name()} — view ${n} ${n === 1 ? 'project' : 'projects'}`;
  });

  protected readonly postsAriaLabel = computed(() => {
    const n = this.postsCount();
    return `${n} ${n === 1 ? 'post' : 'posts'} tagged ${this.name()}`;
  });
}
