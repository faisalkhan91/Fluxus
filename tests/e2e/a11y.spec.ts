import AxeBuilder from '@axe-core/playwright';
import { PRERENDERED_ROUTES, expect, seedTheme, test, type Theme } from './fixtures';

const THEMES: Theme[] = ['dark', 'light'];

/**
 * Color-contrast is intentionally disabled. The site uses a glassmorphism
 * design system with translucent surfaces where axe-core's contrast
 * algorithm produces a high false-positive rate (it doesn't see through
 * `backdrop-filter` blurs to the actual underlying canvas). Contrast is
 * tracked separately during manual design reviews and the dark/light
 * theme tokens in `src/styles.css` are tuned to satisfy WCAG AA on the
 * primary text variables.
 *
 * Everything else WCAG 2A / 2AA / 2.1AA still runs — this spec catches
 * structural regressions: missing labels, ARIA misuse, focusable
 * scrollable regions, nested interactive controls, list/landmark
 * structure, etc.
 */
const DISABLED_RULES = ['color-contrast'];

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
