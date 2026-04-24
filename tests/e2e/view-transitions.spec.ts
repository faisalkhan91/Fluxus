import { devices } from '@playwright/test';
import { expect, readViewTransitionFlag, test, trackViewTransitions } from './fixtures';

/**
 * Force the desktop project so we can use the sidebar's plain anchor links to
 * trigger router navigation. The mobile pill nav uses imperative
 * `router.navigate()` calls from button clicks, which would still fire the
 * transition but make the spec's selector brittle across breakpoints.
 */
test.use({ ...devices['Desktop Chrome'] });

test.describe('View Transitions API integration', () => {
  test('document.startViewTransition fires on route change', async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'View Transitions API is currently only available in Chromium-based browsers.',
    );

    await trackViewTransitions(page);
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');

    const supported = await page.evaluate(
      () =>
        typeof (
          document as Document & { startViewTransition?: unknown }
        ).startViewTransition === 'function',
    );
    expect(supported, 'browser must expose document.startViewTransition').toBe(true);

    // The first navigation (the goto above) may itself trigger a transition
    // depending on Angular's router timing — we only care that *subsequent*
    // route changes wire through startViewTransition. Reset and assert.
    await page.evaluate(() => {
      (window as Window & { __vtCalled?: boolean }).__vtCalled = false;
    });

    // Sidebar uses RouterLink anchors → tap rather than full reload.
    await page.locator('a[href="/skills"]').first().click();
    await page.waitForURL('**/skills');

    await expect.poll(() => readViewTransitionFlag(page)).toBe(true);
  });
});
