import AxeBuilder from '@axe-core/playwright';
import { PRERENDERED_ROUTES, expect, seedTheme, test, type Theme } from './fixtures';

const THEMES: Theme[] = ['dark', 'light'];

/**
 * color-contrast is now ENFORCED on the default crimson themes. It was
 * previously disabled on the assumption that glassmorphism / backdrop-blur
 * surfaces produced false positives — but a Phase-4 audit (axe across every
 * route, both themes) found that assumption masked REAL failures: the accent
 * red used as text (links, tag pills, active nav labels) sat at 3.4–4.2:1.
 * Those are fixed via a per-theme `--text-accent` token in styles.css, and
 * the glass surfaces themselves come back clean (axe resolves the composited
 * canvas). Keeping the rule on locks the fix in.
 *
 * The `THEMES` below cover crimson dark/light only. The other registered
 * themes (tokyo-night, nord, solarized-light, …) still carry pre-existing
 * contrast debt in their muted-text + syntax-highlight palettes; broadening
 * this loop to all themes is tracked as a follow-up once those are tuned.
 */
const DISABLED_RULES: string[] = [];

for (const theme of THEMES) {
  test.describe(`a11y — ${theme} theme`, () => {
    for (const route of PRERENDERED_ROUTES) {
      test(`route ${route} has no serious/critical axe violations`, async ({ page }) => {
        await seedTheme(page, theme);
        await page.goto(route);

        // Wait for hydration to finish. We bail at 5s so a hung route still
        // produces a useful failure rather than a Playwright timeout.
        await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

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
