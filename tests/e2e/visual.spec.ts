import { test, expect, seedTheme, enableReducedMotion, PRERENDERED_ROUTES } from './fixtures';

/**
 * Visual regression baselines per route × theme. Mobile coverage is provided
 * by the second Playwright project (mobile-chromium) which runs the same
 * specs against the Pixel 7 viewport.
 *
 * Animations and the View Transitions API are silenced via reduced-motion so
 * snapshots are deterministic; full-page captures include below-the-fold
 * content for layout-shift detection.
 *
 * Update the baselines after intentional design changes with:
 *   npm run e2e:visual:update
 *
 * The plain `playwright test` invocation skips this file unless
 * `VISUAL_REGRESSION=1` is set — see `testIgnore` in `playwright.config.ts`.
 */
const THEMES = ['dark', 'light'] as const;

for (const theme of THEMES) {
  test.describe(`visual regression — ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await enableReducedMotion(page);
      await seedTheme(page, theme);
    });

    for (const route of PRERENDERED_ROUTES) {
      test(`route ${route} matches baseline`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'networkidle' });
        // Pause web fonts shimmer + skeleton animations long enough to settle.
        await page.waitForTimeout(250);
        await expect(page).toHaveScreenshot({
          fullPage: true,
          // Mask known-volatile regions so timestamps / progress bars don't
          // produce diffs on every run.
          mask: [page.locator('.reading-progress'), page.locator('.post-date')],
          maxDiffPixelRatio: 0.02,
          animations: 'disabled',
        });
      });
    }
  });
}
