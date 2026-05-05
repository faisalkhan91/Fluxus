/**
 * Single source of truth for the available IDE themes.
 *
 * Consumed by ThemeService (resolution + persistence), the command palette
 * (action items), and the sidebar / mobile FAB (current-theme display).
 * The inline pre-paint script in `src/index.html` deliberately does NOT
 * import from here — it inlines its own allowlist so it can run before any
 * JS bundle loads. The two lists are kept in lockstep by the unit tests.
 *
 * Adding a theme:
 *   1. Append an entry below + extend the `ThemeId` union.
 *   2. Append a `[data-theme='<id>']` token block to `src/styles.css`
 *      (mirroring the structure of `[data-theme='crimson-light']`).
 *   3. Append the same id to the inline pre-paint script's allowlist in
 *      `src/index.html` and re-run `npm run build:prod` so audit-csp
 *      regenerates the script-src hash.
 */

export type ThemeId =
  | 'crimson-dark'
  | 'crimson-light'
  | 'tokyo-night'
  | 'solarized-light'
  | 'nord'
  | 'ayu-dark'
  | 'rose-pine'
  | 'night-owl'
  | 'horizon'
  | 'github-light';

export interface ThemeDef {
  /** Stable identifier; written to `<html data-theme="...">` and localStorage. */
  id: ThemeId;
  /** Human-readable name, e.g. "Tokyo Night". Surfaced in the palette + sidebar. */
  label: string;
  /**
   * Coarse light/dark scheme for the theme. Drives:
   *   - `<meta name="color-scheme">` (form controls, scrollbars).
   *   - `<meta name="theme-color">` selection (one tag per scheme).
   *   - `toggle()` last-by-scheme bookkeeping in ThemeService.
   */
  scheme: 'dark' | 'light';
  /** Accent hex used as the palette preview dot + iconic theme color. */
  swatch: string;
  /**
   * Surface color matching `--surface-void` for this theme. Written into
   * the matching `<meta name="theme-color">` tag at runtime so iOS / Android
   * system chrome tracks the active theme.
   */
  themeColor: string;
}

export const THEME_REGISTRY: readonly ThemeDef[] = [
  {
    id: 'crimson-dark',
    label: 'Crimson Dark',
    scheme: 'dark',
    swatch: '#c92a2a',
    themeColor: '#07070b',
  },
  {
    id: 'crimson-light',
    label: 'Crimson Light',
    scheme: 'light',
    swatch: '#b91c1c',
    themeColor: '#f0f0f3',
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    scheme: 'dark',
    swatch: '#7aa2f7',
    themeColor: '#1a1b26',
  },
  {
    id: 'solarized-light',
    label: 'Solarized Light',
    scheme: 'light',
    swatch: '#cb4b16',
    themeColor: '#eee8d5',
  },
  {
    id: 'nord',
    label: 'Nord',
    scheme: 'dark',
    swatch: '#88c0d0',
    themeColor: '#242933',
  },
  {
    id: 'ayu-dark',
    label: 'Ayu Dark',
    scheme: 'dark',
    swatch: '#ff9940',
    themeColor: '#0b0e14',
  },
  {
    id: 'rose-pine',
    label: 'Rose Pine',
    scheme: 'dark',
    swatch: '#eb6f92',
    themeColor: '#191724',
  },
  {
    id: 'night-owl',
    label: 'Night Owl',
    scheme: 'dark',
    swatch: '#7fdbca',
    themeColor: '#011627',
  },
  {
    id: 'horizon',
    label: 'Horizon',
    scheme: 'dark',
    swatch: '#fab795',
    themeColor: '#1c1e26',
  },
  {
    id: 'github-light',
    label: 'GitHub Light',
    scheme: 'light',
    swatch: '#0969da',
    themeColor: '#ffffff',
  },
];

export const DEFAULT_DARK_ID: ThemeId = 'crimson-dark';
export const DEFAULT_LIGHT_ID: ThemeId = 'crimson-light';

const ID_SET: ReadonlySet<ThemeId> = new Set(THEME_REGISTRY.map((t) => t.id));

/** Type-narrowing predicate for validating values from storage / URLs / etc. */
export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && ID_SET.has(value as ThemeId);
}

/**
 * Lookup helper. Falls back to `crimson-dark` rather than throwing so callers
 * downstream of `localStorage` can stay branch-free; pair with `isThemeId`
 * upfront when a missing entry should be treated as an error instead.
 */
export function getThemeDef(id: ThemeId): ThemeDef {
  return THEME_REGISTRY.find((t) => t.id === id) ?? THEME_REGISTRY[0];
}
