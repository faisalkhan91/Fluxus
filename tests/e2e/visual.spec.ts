import { test, expect, seedTheme, enableReducedMotion, PRERENDERED_ROUTES } from './fixtures';
import type { Page } from '@playwright/test';
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
 * Full-page snapshot with the known-volatile regions masked (the reading
 * progress bar animates; post dates are date-formatted and not a design
 * concern). 2% per-pixel tolerance absorbs sub-pixel font/AA noise.
 */
async function shot(page: Page) {
  await expect(page).toHaveScreenshot({
    fullPage: true,
    mask: [page.locator('.reading-progress'), page.locator('.post-date')],
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
}

/**
 * The two Crimson brand themes get the full route matrix — they're the
 * defaults the overwhelming majority of visitors see, so every prerendered
 * surface is pixel-locked here.
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
        await shot(page);
      });
    }

    // The `/projects?view=list` layout is a distinct surface from the
    // grid captured above — featured projects render as stacked hero
    // cards and the rest as compact "More work" rows. Adding explicit
    // coverage so regressions on either path are caught per viewport.
    test('route /projects?view=list matches baseline', async ({ page }) => {
      await page.goto('/projects?view=list', { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      await shot(page);
    });

    // The grid view + the tag archive both render the shared app-post-card's
    // sibling, app-project-card — surfaces the default `/projects` (list) and
    // `view=list` snapshots above don't exercise. Lock them so card-chrome
    // regressions are caught per theme + viewport.
    test('route /projects?view=grid matches baseline', async ({ page }) => {
      await page.goto('/projects?view=grid', { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      await shot(page);
    });

    test('route /projects/tag/aws matches baseline', async ({ page }) => {
      await page.goto('/projects/tag/aws', { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      await shot(page);
    });

    // The wildcard 404 surface (glitch heading, terminal echo, suggestion
    // cards). Served as the CSR shell, so we hit a deterministic bogus path
    // and let the SPA render NotFoundComponent.
    test('route /404 matches baseline', async ({ page }) => {
      await page.goto('/this-route-does-not-exist', { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      await shot(page);
    });
  });
}

/**
 * The other eight registered themes get a focused three-route set rather than
 * the full matrix — enough to catch the surfaces the theme tokens actually
 * drive without exploding the baseline footprint:
 *   - `/` (hero): accent-as-text, muted nav labels, latest-post cards.
 *   - `/projects`: per-theme card chrome + the WebP project imagery.
 *   - a representative blog post: per-theme `hljs` syntax-token palette.
 * Per-theme WCAG-AA contrast itself is enforced exhaustively by the all-theme
 * axe pass in `a11y.spec.ts`; these snapshots guard the rendered composition.
 */
const SECONDARY_THEMES: Theme[] = [
  'tokyo-night',
  'solarized-light',
  'nord',
  'ayu-dark',
  'rose-pine',
  'night-owl',
  'horizon',
  'github-light',
];

const SECONDARY_ROUTES = ['/', '/projects', '/blog/angular-signals-state-management'] as const;

for (const themeId of SECONDARY_THEMES) {
  test.describe(`visual regression — ${themeId}`, () => {
    test.beforeEach(async ({ page }) => {
      await enableReducedMotion(page);
      await seedTheme(page, themeId);
    });

    for (const route of SECONDARY_ROUTES) {
      test(`route ${route} matches baseline`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'networkidle' });
        await page.waitForTimeout(250);
        await shot(page);
      });
    }
  });
}
