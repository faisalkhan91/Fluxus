import AxeBuilder from '@axe-core/playwright';
import { PRERENDERED_ROUTES, expect, seedTheme, test, type Theme } from './fixtures';

/**
 * Every registered theme is exercised. axe runs per-theme because contrast
 * is a per-palette property: a structural pass on one theme says nothing
 * about another's token values.
 */
const THEMES: Theme[] = [
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
];

/**
 * color-contrast is ENFORCED across all themes. It was previously disabled
 * on the assumption that glassmorphism / backdrop-blur surfaces produced
 * false positives — but a Phase-4 audit (axe across every route, every
 * theme) found that assumption masked REAL failures: accent-as-text at
 * 3.4–4.2:1, muted labels that lost contrast over elevated glass, and
 * several syntax-highlight tokens below AA on light surfaces. All are fixed
 * in styles.css (per-theme `--text-accent`, bumped `--text-muted`, darkened/
 * lightened hljs tokens); axe resolves the composited glass canvas, so the
 * surfaces themselves come back clean. Keeping the rule on, on every theme,
 * locks the fix in and catches any new palette from regressing.
 */
const DISABLED_RULES: string[] = [];

/**
 * The shared PRERENDERED_ROUTES list (8 top-level routes + 1 blog post) drives
 * the visual + CSP suites, so it deliberately omits the deeper route *shapes*.
 * a11y coverage must not stop there: a project-detail page and the two tag
 * archives are distinct DOM/token surfaces (e.g. the `.detail-chip-skill`
 * accent-as-text chips only exist on `/projects/:slug`). Scan them here too so
 * a per-palette contrast or structural regression on those shapes can't slip
 * through the gate. Kept local to a11y so visual baselines aren't forced.
 */
const A11Y_ROUTES = [
  ...PRERENDERED_ROUTES,
  '/projects/image-generator',
  '/projects/tag/ai',
  '/blog/tag/angular',
] as const;

for (const theme of THEMES) {
  test.describe(`a11y — ${theme} theme`, () => {
    for (const route of A11Y_ROUTES) {
      test(`route ${route} has no serious/critical axe violations`, async ({ page }) => {
        await seedTheme(page, theme);
        await page.goto(route);

        // Wait for hydration to finish. We bail at 5s so a hung route still
        // produces a useful failure rather than a Playwright timeout.
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

        // Let web fonts load and the page commit at least two paints before axe
        // samples colour-contrast. Under a fully-parallel run the CPU is
        // contended, and axe could otherwise read card text mid-paint — before
        // the backdrop-filter glass has composited — and flag a transient
        // contrast value that never ships (observed as flaky nord failures).
        // fonts.ready + a double rAF gives axe a settled, deterministic canvas.
        await page
          .evaluate(async () => {
            if (document.fonts?.ready) await document.fonts.ready;
            await new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
            );
          })
          .catch(() => {});

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .disableRules(DISABLED_RULES)
          .analyze();

        const blocking = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        );

        if (blocking.length > 0) {
          const summary = blocking
            .map((v) => {
              const sample = v.nodes
                .slice(0, 3)
                .map((n) => `      - ${n.target.join(' > ')}`)
                .join('\n');
              return `  • [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})\n${sample}`;
            })
            .join('\n');
          throw new Error(
            `Axe found ${blocking.length} serious/critical violation(s) on ${route} (${theme}):\n${summary}`,
          );
        }

        expect(blocking).toEqual([]);
      });
    }
  });
}
