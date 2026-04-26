import { expect, seedTheme, test } from './fixtures';

/**
 * The inline pre-paint <script> in src/index.html is the *only* thing that
 * sets `data-theme="light"` synchronously, before Angular hydrates. If a
 * future change accidentally moves it to an Angular effect / app initializer,
 * users will see a dark→light flash on the first paint (FOUC). These tests
 * catch that regression by asserting the attribute is present immediately
 * after `goto()`, with no Angular bootstrap allowed in between.
 */
test.describe('theme pre-paint (no FOUC)', () => {
  test('seeded light theme is applied synchronously by the pre-paint script', async ({ page }) => {
    await seedTheme(page, 'light');
    await page.goto('/');

    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(dataTheme).toBe('light');
  });

  test('seeded dark theme leaves data-theme unset (dark is the default)', async ({ page }) => {
    await seedTheme(page, 'dark');
    await page.goto('/');

    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(dataTheme).toBeNull();
  });

  test('the inline pre-paint script lives in <head> and references theme storage', async ({
    page,
  }) => {
    await page.goto('/');
    const inlineScripts = await page.$$eval('head script:not([src])', (els) =>
      els.map((el) => el.textContent ?? ''),
    );
    const prePaint = inlineScripts.find(
      (src) => src.includes("localStorage.getItem('theme')") || src.includes('data-theme'),
    );
    expect(prePaint).toBeTruthy();
  });
});
