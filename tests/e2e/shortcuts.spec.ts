import AxeBuilder from '@axe-core/playwright';
import { expect, test, seedTheme, type Theme } from './fixtures';

/**
 * Keyboard-shortcuts overlay (?). Renders the live HotkeyService registry, so
 * it should list the palette / terminal / shortcuts hotkeys. Proves open via
 * `?`, the rendered list, Escape-to-close, and axe cleanliness of the open
 * overlay across a dark + light theme.
 */
const OVERLAY = 'dialog[aria-label="Keyboard shortcuts"]';

test.describe('keyboard-shortcuts overlay', () => {
  test('? opens the overlay listing the global shortcuts', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Shift+Slash');
    await expect(page.locator(OVERLAY)).toBeVisible();
    await expect(page.locator(OVERLAY)).toContainText('Open command palette');
    await expect(page.locator(OVERLAY)).toContainText('Open terminal');
  });

  test('Escape closes the overlay', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Shift+Slash');
    await expect(page.locator(OVERLAY)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(OVERLAY)).toBeHidden();
  });

  test('the close button dismisses the overlay', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Shift+Slash');
    await page.locator('.sc-close').click();
    await expect(page.locator(OVERLAY)).toBeHidden();
  });

  for (const theme of ['crimson-dark', 'github-light'] as Theme[]) {
    test(`open shortcuts overlay has no serious/critical axe violations (${theme})`, async ({
      page,
    }) => {
      await seedTheme(page, theme);
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.keyboard.press('Shift+Slash');
      await expect(page.locator(OVERLAY)).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include(OVERLAY)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(blocking).toEqual([]);
    });
  }
});
