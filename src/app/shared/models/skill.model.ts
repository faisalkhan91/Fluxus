export interface Skill {
  name: string;
  iconSrc?: string;
  /**
   * 0–100 self-rated proficiency. Only set on a category's lead skills so
   * the page hints at depth without turning into a noisy chart of bars.
   * Consumed by `ui-skill-badge` as a thin under-bar (no numeric label).
   */
  level?: number;
  /**
   * Extra match terms used by `SkillUsageService` when joining against
   * project / blog tags. Populate when the canonical `slugify(name)` would
   * miss tags users actually write — e.g. `HTML5` aliased to `HTML` so a
   * project tagged "HTML" still wires up to the badge.
   *
   * Aliases never affect routing; the URL slug is derived elsewhere from
   * whichever variant has live matches.
   */
  aliases?: string[];
}

export interface SkillCategory {
  title: string;
  subtitle?: string;
  skills: Skill[];
}
