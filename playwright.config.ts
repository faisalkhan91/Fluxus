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
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
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
    command:
      'npx http-server dist/fluxus/browser -p 4300 -s --proxy http://localhost:4300?',
    url: 'http://localhost:4300/',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
