export type SkillTier = 'core' | 'working' | 'learning';

export interface Skill {
  name: string;
  iconSrc?: string;
  /**
   * Optional tier override. Without this the skill's tier is derived
   * from its project count (see `deriveTier` in `skills-data.service`):
   * ≥3 projects = core, 1–2 = working, 0 = learning. Set explicitly
   * when a skill is depth-of-practice core but has no public projects
   * (e.g., team-internal work) and the derived tier would under-sell it.
   */
  tier?: SkillTier;
  /**
   * Short one-line descriptor shown only on the hero tile of a bento
   * category. Leave undefined on satellite skills — they render icon +
   * name only.
   */
  tagline?: string;
  /**
   * Year the skill was first put into production use. Shown as a
   * `since YYYY` chip on hero tiles. Hero-only; satellites ignore it.
   */
  since?: number;
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
  /**
   * Flag this skill's icon as single-colour monochrome (e.g. Kafka,
   * Cursor, Splunk). Enables a CSS filter on dark themes so the icon
   * stays visible against dark surfaces without touching coloured
   * logos. No-op on light themes.
   */
  mono?: boolean;
}

export interface SkillCategory {
  title: string;
  subtitle?: string;
  skills: Skill[];
}
