import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SkillsDataService, deriveTier } from '@core/services/skills-data.service';
import { SkillUsageService } from '@core/services/skill-usage.service';
import { Skill, SkillTier } from '@shared/models/skill.model';
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
 * sorted by category (preserving catalog order) — sticky thead stays
 * visible while scrolling long category groups.
 *
 * The same card-link pattern used on `ui-skill-badge` applies per row:
 * the skill-name cell hosts a stretched anchor that makes the whole
 * row clickable without nesting anchors.
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
            [class.skills-row--learning]="row.tier === 'learning'"
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
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--surface-base);
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
        transition:
          background-color var(--transition-base),
          opacity var(--transition-base);
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
        Learning-tier rows step back at 0.62 opacity so the list and
        grid views express the same hierarchy. Without this, the grid
        dims orphan skills but the list rendered them at full
        prominence — the same skill (e.g. Rust) read as a faded tile
        in grid mode and a regular row in list mode. Hover restores
        full opacity so users still get a clear "interactive" cue.
      */
      tbody .skills-row--learning {
        opacity: 0.62;
      }

      tbody .skills-row--learning:hover,
      tbody .skills-row--learning:focus-within {
        opacity: 1;
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
      }

      [data-theme$='-light'] .row-icon[src*='cursor-original'],
      [data-theme$='-light'] .row-icon[src*='githubcopilot-original'],
      [data-theme$='-light'] .row-icon[src*='amazonwebservices-original-wordmark'] {
        filter: var(--icon-drop-shadow);
      }

      .row-icon[src*='cursor-original'],
      .row-icon[src*='githubcopilot-original'],
      .row-icon[src*='amazonwebservices-original-wordmark'] {
        filter: var(--icon-drop-shadow) invert(1) hue-rotate(180deg);
      }

      [data-theme$='-light'] .row-icon[src*='typescript-original'],
      [data-theme$='-light'] .row-icon[src*='icons8-ansible'],
      [data-theme$='-light'] .row-icon[src*='anthropic-original'] {
        filter: var(--icon-drop-shadow) drop-shadow(0 0 1px rgba(0, 0, 0, 0.45));
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

  protected rows = computed<Row[]>(() => {
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
