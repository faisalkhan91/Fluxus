import { expect, test } from './fixtures';

/**
 * The wildcard `**` route renders NotFoundComponent. It's served as the
 * CSR shell (index.csr.html copied to 404.html in the image), so the SPA
 * boots client-side and the router renders the glitch 404 page for any
 * unknown path. The component also sets
 * `<meta name="robots" content="noindex,nofollow">` in its constructor so
 * a crawler that reaches a bad in-app link never indexes the 404 chrome.
 *
 * No prior e2e exercised this route — it's the one user-reachable surface
 * with zero coverage.
 */
test.describe('404 / not-found', () => {
  test('renders the glitch 404 page and echoes the attempted path', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');

    // The big glitch "404" is the visible affordance (the h1 is
    // visually-hidden for SR, so assert its text, not visibility).
    await expect(page.locator('.glitch[data-text="404"]')).toBeVisible();
    await expect(page.locator('h1#error-heading')).toHaveText(/404/);

    // The simulated terminal echoes the path the visitor tried.
    await expect(page.locator('.terminal-body')).toContainText('this-route-does-not-exist');
  });

  test('marks the page noindex,nofollow for crawlers', async ({ page }) => {
    await page.goto('/another-bogus-path');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex,nofollow',
    );
  });
});
