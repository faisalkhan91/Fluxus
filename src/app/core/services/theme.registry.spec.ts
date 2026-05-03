import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_DARK_ID,
  DEFAULT_LIGHT_ID,
  THEME_REGISTRY,
  getThemeDef,
  isThemeId,
  type ThemeId,
} from './theme.registry';

describe('theme.registry', () => {
  it('every entry carries the full ThemeDef contract', () => {
    for (const def of THEME_REGISTRY) {
      expect(def.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(def.label.length).toBeGreaterThan(0);
      expect(['dark', 'light']).toContain(def.scheme);
      expect(def.swatch).toMatch(/^#[0-9a-f]{6}$/i);
      expect(def.themeColor).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('ids are unique', () => {
    const ids = THEME_REGISTRY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exposes both crimson defaults', () => {
    const ids = THEME_REGISTRY.map((t) => t.id);
    expect(ids).toContain(DEFAULT_DARK_ID);
    expect(ids).toContain(DEFAULT_LIGHT_ID);
    expect(getThemeDef(DEFAULT_DARK_ID).scheme).toBe('dark');
    expect(getThemeDef(DEFAULT_LIGHT_ID).scheme).toBe('light');
  });

  it('isThemeId rejects unknown values', () => {
    expect(isThemeId('crimson-dark')).toBe(true);
    expect(isThemeId('not-a-theme')).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
    expect(isThemeId(42)).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });

  it('getThemeDef falls back to crimson-dark for unknown ids', () => {
    expect(getThemeDef('crimson-dark')).toBe(THEME_REGISTRY[0]);
    expect(getThemeDef('totally-fake' as ThemeId)).toBe(THEME_REGISTRY[0]);
  });

  /**
   * The inline pre-paint script in src/index.html cannot import the
   * registry — it has to run before any JS bundle parses — so it inlines
   * its own allowlist of valid ids. This spec is the contract test that
   * keeps the two lists in lockstep: every registry id must appear in
   * the inline script, and every id the inline script knows about must
   * be registered. Drift between the two surfaces as a CSP / FOUC bug
   * that's painful to debug in the wild, hence the upstream check here.
   */
  it('inline pre-paint script allowlist matches the registry', () => {
    // Resolve relative to the workspace root rather than `import.meta.url`
    // so the lookup works regardless of how the runner virtualises module
    // URLs (Vitest under the Angular @angular/build:unit-test wrapper uses
    // a non-file URL scheme that breaks `fileURLToPath`).
    const indexPath = resolve(process.cwd(), 'src/index.html');
    const html = readFileSync(indexPath, 'utf-8');
    const match = html.match(/THEME_IDS\s*=\s*\[([^\]]+)\]/);
    expect(match, 'expected `THEME_IDS = [...]` array in src/index.html').toBeTruthy();
    const inline = (match![1].match(/'([^']+)'/g) ?? []).map((s) => s.slice(1, -1));
    expect(new Set(inline)).toEqual(new Set(THEME_REGISTRY.map((t) => t.id)));
  });
});
