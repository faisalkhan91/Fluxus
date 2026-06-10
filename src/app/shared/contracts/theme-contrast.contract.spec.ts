/**
 * Programmatic WCAG contrast contract for every theme.
 *
 * WHY THIS EXISTS (not just axe): the e2e axe pass reports "color-contrast"
 * green, but axe samples *computed background colours* and is routinely fooled
 * by this app's translucent text (`rgba(...)` muted/secondary tokens) layered
 * over `backdrop-filter: blur()` glass surfaces — it can read a lighter
 * effective background than what the user sees, masking sub-AA muted text. The
 * muted↔body contrast on the dark glass themes has churned repeatedly for
 * exactly this reason.
 *
 * This test removes the guesswork: it parses `src/styles.css`, resolves each
 * theme's text + surface tokens (honouring `:root` inheritance and `var()`
 * indirection), composites the translucent text token over each *opaque*
 * surface it actually lands on (base / raised / overlay — the cards, palette,
 * terminal and nav-pill backgrounds), and asserts the real WCAG 2.x contrast
 * ratio clears the **4.5:1 AA floor for normal text**. It is intentionally
 * stricter and more honest than axe, and it runs in the fast unit tier.
 *
 * If this fails: a theme's text token dipped below AA on one of its surfaces.
 * Fix by darkening that surface or lifting the text token's alpha/lightness —
 * never by loosening the threshold below 4.5.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const STYLES = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf-8');

// Mirrors THEME_REGISTRY (src/app/core/services/theme.registry.ts) + the
// index.html pre-paint allowlist. The parser below also asserts the CSS
// actually defines exactly this set, so drift surfaces here.
const EXPECTED_THEMES = [
  'crimson-dark',
  'crimson-light',
  'tokyo-night',
  'solarized-light',
  'nord',
  'ayu-dark',
  'rose-pine',
  'night-owl',
  'horizon',
  'github-light',
] as const;

const TEXT_TOKENS = ['--text-primary', '--text-secondary', '--text-muted'] as const;
const SURFACE_TOKENS = ['--surface-base', '--surface-raised', '--surface-overlay'] as const;
const AA_NORMAL = 4.5;

interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Brace-depth-aware extraction of top-level CSS rules. A naive regex desyncs on
 * nested `@media`/`@keyframes` braces, so we track depth and only capture rules
 * at depth 0 (where `:root` and every `[data-theme]` block live).
 */
function extractCustomProperties(css: string): {
  root: Record<string, string>;
  themes: Record<string, Record<string, string>>;
} {
  const root: Record<string, string> = {};
  const themes: Record<string, Record<string, string>> = {};
  // Strip comments first; then a depth-0 `;` (the leading `@import '…';` lines)
  // is a segment boundary so that preamble never bleeds into the `:root` selector.
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  let segStart = 0;
  let selector = '';
  let bodyStart = 0;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === ';' && depth === 0) {
      segStart = i + 1;
    } else if (ch === '{') {
      if (depth === 0) {
        selector = src.slice(segStart, i).trim();
        bodyStart = i + 1;
      }
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const body = src.slice(bodyStart, i);
        const decls = parseDeclarations(body);
        if (Object.keys(decls).length) {
          for (const sel of selector.split(',').map((s) => s.trim())) {
            if (sel === ':root') Object.assign(root, decls);
            const m = sel.match(/^\[data-theme='([^']+)'\]$/);
            if (m) Object.assign((themes[m[1]] ??= {}), decls);
          }
        }
        segStart = i + 1;
      }
    }
  }
  return { root, themes };
}

function parseDeclarations(body: string): Record<string, string> {
  // Strip comments, then pull `--prop: value;` pairs. Theme/`:root` bodies are
  // flat (no nested rules), so a simple pass is safe here.
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: Record<string, string> = {};
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

function resolveToken(
  theme: string,
  name: string,
  data: { root: Record<string, string>; themes: Record<string, Record<string, string>> },
  seen = new Set<string>(),
): string | null {
  if (seen.has(name)) return null;
  seen.add(name);
  const value = data.themes[theme]?.[name] ?? data.root[name];
  if (value == null) return null;
  const varMatch = value.match(/var\((--[^,)]+)(?:,\s*([^)]+))?\)/);
  if (varMatch) {
    const resolved = resolveToken(theme, varMatch[1].trim(), data, seen);
    return resolved ?? (varMatch[2] ? varMatch[2].trim() : null);
  }
  return value;
}

function parseColor(value: string | null): Rgb | null {
  if (!value) return null;
  const v = value.trim();
  let m = v.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    const h = m[1];
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
      a: 1,
    };
  }
  m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const h = m[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }
  m = v.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(',').map((s) => parseFloat(s.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p[3] != null ? p[3] : 1 };
  }
  return null;
}

/** Alpha-composite a (possibly translucent) foreground over an opaque background. */
function composite(fg: Rgb, bg: Rgb): Rgb {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

/** WCAG 2.x relative luminance. */
function luminance(c: Rgb): number {
  const channel = (x: number): number => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

function contrastRatio(c1: Rgb, c2: Rgb): number {
  const l1 = luminance(c1);
  const l2 = luminance(c2);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

const data = extractCustomProperties(STYLES);

describe('theme contrast contract (WCAG AA, computed — not axe)', () => {
  it('defines exactly the expected themes', () => {
    expect(Object.keys(data.themes).sort()).toEqual([...EXPECTED_THEMES].sort());
  });

  for (const theme of EXPECTED_THEMES) {
    describe(theme, () => {
      for (const textToken of TEXT_TOKENS) {
        for (const surfaceToken of SURFACE_TOKENS) {
          it(`${textToken} over ${surfaceToken} clears AA (4.5:1)`, () => {
            const fg = parseColor(resolveToken(theme, textToken, data));
            const bg = parseColor(resolveToken(theme, surfaceToken, data));
            expect(fg, `${theme} ${textToken} must resolve to a colour`).not.toBeNull();
            expect(bg, `${theme} ${surfaceToken} must resolve to a colour`).not.toBeNull();
            const ratio = contrastRatio(composite(fg as Rgb, bg as Rgb), bg as Rgb);
            expect(
              ratio,
              `${theme} ${textToken} on ${surfaceToken} = ${ratio.toFixed(2)}:1 (needs ≥ ${AA_NORMAL})`,
            ).toBeGreaterThanOrEqual(AA_NORMAL);
          });
        }
      }
    });
  }
});
