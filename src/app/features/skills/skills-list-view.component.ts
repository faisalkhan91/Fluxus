import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SkillsDataService, deriveTier } from '@core/services/skills-data.service';
import { SkillUsageService } from '@core/services/skill-usage.service';
import type { Skill, SkillTier } from '@shared/models/skill.model';
import { slugify } from '@shared/utils/string.utils';

interface Row {
  skill: Skill;
  category: string;
  tier: SkillTier;
  projectsCount: number;
  postsCount: number;
  href: string | undefined;
  anchorId: string;
  /**
   * True for the first row of each category group. Used to paint a
   * 1 px separator on phones, where the Category column is hidden
   * and the grouping would otherwise vanish.
   */
  groupStart: boolean;
}

/**
 * Dense, scannable alternative to the bento grid. One row per skill,
 * sorted by category (preserving catalog order).
 *
 * The same card-link pattern used on `ui-skill-badge` applies per row:
 * the skill-name cell hosts a stretched anchor that makes the whole
 * row clickable without nesting anchors.
 *
 * The thead used to be `position: sticky; top: 0`, but the page body
 * scrolls the document — not the table — so the sticky thead was
 * anchored to the viewport, not the table's scroll container. That
 * either did nothing useful (when the chrome already pinned the
 * mobile nav above) or collided with the chrome header. Dropped in
 * favour of the document's native scroll: the table is short enough
 * (≤ 43 rows × ~40 px ≈ 1700 px) that re-reading the header from the
 * top is the cheaper interaction.
 */
@Component({
  selector: 'app-skills-list-view',
  template: `
    <table class="skills-table" aria-label="All skills, grouped by category">
      <thead>
        <tr>
          <th scope="col" class="col-name">Skill</th>
          <th scope="col" class="col-category">Category</th>
          <th scope="col" class="col-tier">Tier</th>
          <th scope="col" class="col-count">Projects</th>
          <th scope="col" class="col-count">Posts</th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.anchorId) {
          <tr
            class="skills-row"
            [class.skills-row--link]="!!row.href"
            [class.skills-row--group-start]="row.groupStart"
            [id]="row.anchorId"
          >
            <td class="col-name">
              @if (row.skill.iconSrc) {
                <img
                  [ngSrc]="row.skill.iconSrc"
                  [alt]="row.skill.name"
                  width="24"
                  height="24"
                  class="row-icon"
                  [class.row-icon--mono]="row.skill.mono"
                />
              }
              @if (row.href; as link) {
                <a class="row-name row-link" [routerLink]="link">{{ row.skill.name }}</a>
              } @else {
                <span class="row-name">{{ row.skill.name }}</span>
              }
            </td>
            <td class="col-category">{{ row.category }}</td>
            <td class="col-tier">
              <span
                class="tier-pill"
                [class.tier-core]="row.tier === 'core'"
                [class.tier-working]="row.tier === 'working'"
                [class.tier-learning]="row.tier === 'learning'"
              >
                {{ tierLabel(row.tier) }}
              </span>
            </td>
            <td class="col-count">{{ row.projectsCount || '—' }}</td>
            <td class="col-count">{{ row.postsCount || '—' }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .skills-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      thead th {
        font-family: var(--font-mono);
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
        text-align: left;
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--glass-border);
      }

      tbody .skills-row {
        transition: background-color var(--transition-base);
      }

      tbody td {
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--glass-border);
        vertical-align: middle;
      }

      tbody .skills-row:hover {
        background: var(--glass-bg-hover);
      }

      /*
        Category-group separator. The Category column is hidden under
        768 px (see media query at the bottom of this file) so on
        phones the list otherwise reads as 43 undifferentiated rows.
        A 1 px accent rule at the top of each category's first row
        re-introduces the grouping cheaply, without adding a sticky
        sub-heading bar that would compete with the page header.
      */
      tbody .skills-row--group-start td {
        border-top: 1px solid var(--glass-border-hover);
      }
      tbody .skills-row--group-start:first-child td {
        border-top: none;
      }

      .col-name {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      /* Mirror the single-cell flex layout onto the heading so columns
         still align with the body row below it. */
      thead .col-name {
        display: table-cell;
      }

      .row-icon {
        width: 24px;
        height: 24px;
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
      .row-icon--mono {
        filter: var(--icon-mono-filter, none);
      }

      .row-name {
        font-family: var(--font-tech);
        font-weight: 500;
        color: var(--text-primary);
      }

      .row-link {
        text-decoration: none;
      }

      .row-link:hover,
      .row-link:focus-visible {
        color: var(--accent);
      }

      /* Stretch the skill-name anchor across the full name cell so the
         click target matches the bento badge card-link affordance. Rows
         carry a :hover background so the whole tr reads as clickable;
         keyboard focus routes through the anchor directly. */
      .skills-row--link .col-name {
        position: relative;
      }

      .skills-row--link .row-link::after {
        content: '';
        position: absolute;
        inset: 0;
      }

      .col-category {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .col-count {
        font-variant-numeric: tabular-nums;
        color: var(--text-muted);
        width: 1%;
        white-space: nowrap;
      }

      .tier-pill {
        display: inline-block;
        font-family: var(--font-mono);
        font-size: 0.625rem;
        line-height: 1;
        padding: 3px var(--space-2);
        border-radius: var(--radius-pill);
        border: 1px solid var(--glass-border);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      /*
        Tier expressions stay inside the page's brand palette. The
        earlier version reached for --accent-secondary (blue on
        Crimson, etc.) for "Working", which read as a second brand
        accent on an otherwise red page. Now all three tiers ride the
        crimson axis at different intensities so the list view looks
        like the rest of the site:

          - Core     : filled accent (loudest)
          - Working  : subtle accent tint + accent border (middle)
          - Learning : muted text + a real (not invisible) border (quiet)
      */
      .tier-core {
        color: var(--text-on-accent);
        background: var(--accent);
        border-color: var(--accent);
      }

      .tier-working {
        color: var(--accent);
        background: var(--accent-subtle);
        border-color: var(--accent);
      }

      .tier-learning {
        color: var(--text-muted);
        /* --glass-border is ~7 % alpha — essentially invisible on a
           glass surface. Step up to the hover variant so the pill
           actually reads as a pill, not raw text. */
        border-color: var(--glass-border-hover);
      }

      @media (max-width: 768px) {
        .col-category,
        thead .col-category {
          display: none;
        }

        tbody td,
        thead th {
          padding: var(--space-3) var(--space-2);
        }
      }
    `,
  ],
  imports: [NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsListViewComponent {
  private skillsData = inject(SkillsDataService);
  private usage = inject(SkillUsageService);

  protected readonly rows = computed<Row[]>(() => {
    const out: Row[] = [];
    for (const cat of this.skillsData.categories()) {
      cat.skills.forEach((skill, idx) => {
        const u = this.usage.usageFor(skill);
        const href = u?.projectsRouteSlug ? `/projects/tag/${u.projectsRouteSlug}` : undefined;
        out.push({
          skill,
          category: cat.title,
          tier: deriveTier(skill, u),
          projectsCount: u?.projects?.length ?? 0,
          postsCount: u?.posts?.length ?? 0,
          href,
          anchorId: `skill-${slugify(skill.name)}`,
          groupStart: idx === 0,
        });
      });
    }
    return out;
  });

  protected tierLabel(tier: SkillTier): string {
    switch (tier) {
      case 'core':
        return 'Core';
      case 'working':
        return 'Working';
      case 'learning':
        return 'Learning';
    }
  }
}
