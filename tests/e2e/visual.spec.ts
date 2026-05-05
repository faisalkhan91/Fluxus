import { test, expect, seedTheme, enableReducedMotion, PRERENDERED_ROUTES } from './fixtures';
import type { Theme } from './fixtures';

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

/**
 * Routes-wide coverage stays restricted to the two Crimson themes (the
 * site's brand defaults) so the baseline footprint doesn't fan out from
 * `routes × 2 = 18` snapshots to `routes × 6 = 54`. Describe block labels
 * are retained as `'dark'` / `'light'` so the existing committed PNG
 * baselines under `visual.spec.ts-snapshots/` remain valid after the
 * registry refactor — only the seeded id changes (legacy `'dark'` /
 * `'light'` localStorage values are migrated by the inline pre-paint
 * script to the new ids, but seeding the new ids directly skips that
 * round-trip and is more representative of the production flow).
 */
const PRIMARY_THEMES: { label: string; id: Theme }[] = [
  { label: 'dark', id: 'crimson-dark' },
  { label: 'light', id: 'crimson-light' },
];

for (const theme of PRIMARY_THEMES) {
  test.describe(`visual regression — ${theme.label} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await enableReducedMotion(page);
      await seedTheme(page, theme.id);
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

    // The `/projects?view=list` layout is a distinct surface from the
    // grid captured above — featured projects render as stacked hero
    // cards and the rest as compact "More work" rows. Adding explicit
    // coverage so regressions on either path are caught per viewport.
    test('route /projects?view=list matches baseline', async ({ page }) => {
      await page.goto('/projects?view=list', { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      await expect(page).toHaveScreenshot({
        fullPage: true,
        mask: [page.locator('.reading-progress'), page.locator('.post-date')],
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  });
}

/**
 * Hero-only coverage for the additional theme palettes. Catches gross
 * token regressions (a missing `--surface-base`, a broken contrast pair)
 * without exploding the baseline footprint to `routes × 6`. If a future
 * change touches a theme-sensitive layout outside the hero (a new tag
 * pill on /blog, a full-bleed callout on /about), add a one-off
 * snapshot against that single route here rather than expanding the
 * loop to all of PRERENDERED_ROUTES.
 */
const ADDITIONAL_THEMES: Theme[] = ['tokyo-night', 'solarized-light'];

for (const themeId of ADDITIONAL_THEMES) {
  test.describe(`visual regression — ${themeId} (hero only)`, () => {
    test.beforeEach(async ({ page }) => {
      await enableReducedMotion(page);
      await seedTheme(page, themeId);
    });

    test('hero matches baseline', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      await expect(page).toHaveScreenshot({
        fullPage: true,
        mask: [page.locator('.reading-progress'), page.locator('.post-date')],
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  });
}
