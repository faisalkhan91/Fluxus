import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the live visual / a11y pass.
 *
 * Runs against the prerendered production build served via `http-server`.
 * Build the site first:
 *   npm run build:prod
 *
 * Then either:
 *   npm run e2e      — headless run
 *   npm run e2e:ui   — interactive UI mode
 *
 * On a fresh checkout, install the chromium browser binary once:
 *   npm run e2e:install
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Skip visual.spec from the default suite — it owns its own snapshot
  // baselines under tests/e2e/visual.spec.ts-snapshots/ and is opt-in via
  // `npm run e2e:visual`. Keeps the day-to-day suite hermetic.
  testIgnore: process.env['VISUAL_REGRESSION'] === '1' ? [] : ['**/visual.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  expect: {
    toHaveScreenshot: {
      // Allow ~2% difference per pixel — covers font hinting / GPU jitter
      // without missing real layout regressions.
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    // `-s` = silent. `--proxy http://localhost:4300?` makes deep links like
    // `/about` fall back to `about/index.html`, which is exactly how the
    // prerendered routes are laid out on disk.
    command: 'npx http-server dist/fluxus/browser -p 4300 -s --proxy http://localhost:4300?',
    url: 'http://localhost:4300/',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
