import { devices } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Force a mobile viewport so the mobile nav pill (and its menu trigger) is
 * rendered. The desktop project uses a sidebar instead.
 */
test.use({ ...devices['Pixel 7'] });

test.describe('mobile menu focus trap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the pill nav to hydrate so the trigger is interactive.
    await page.waitForSelector('button[aria-label="Menu"][aria-haspopup="dialog"]', {
      state: 'visible',
    });
  });

  test('opens a labeled dialog and traps Tab/Shift+Tab focus', async ({ page }) => {
    const trigger = page.locator('button[aria-label="Menu"][aria-haspopup="dialog"]');
    await trigger.click();

    const dialog = page.locator('div[role="dialog"][aria-label="Navigation menu"]');
    await expect(dialog).toBeVisible();

    // Collect every focusable inside the menu so we can assert wrap behavior.
    const focusableHandles = await dialog
      .locator('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      .elementHandles();
    expect(focusableHandles.length).toBeGreaterThan(1);

    const firstHandle = focusableHandles[0];
    const lastHandle = focusableHandles[focusableHandles.length - 1];

    await firstHandle.focus();
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY');

    // Tab forward through every focusable; should never escape the dialog.
    for (let i = 0; i < focusableHandles.length + 2; i += 1) {
      await page.keyboard.press('Tab');
      const insideDialog = await page.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
        return !!dlg && dlg.contains(document.activeElement);
      });
      expect(insideDialog).toBe(true);
    }

    // Shift+Tab from the first focusable wraps to the last.
    await firstHandle.focus();
    await page.keyboard.press('Shift+Tab');
    const wrappedToLast = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!dlg) return false;
      const focusables = Array.from(
        dlg.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      return focusables.at(-1) === document.activeElement;
    });
    expect(wrappedToLast).toBe(true);

    // Tab from the last focusable wraps to the first.
    await lastHandle.focus();
    await page.keyboard.press('Tab');
    const wrappedToFirst = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!dlg) return false;
      const focusables = Array.from(
        dlg.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      return focusables[0] === document.activeElement;
    });
    expect(wrappedToFirst).toBe(true);
  });

  test('Escape closes the menu and restores focus to the trigger', async ({ page }) => {
    const trigger = page.locator('button[aria-label="Menu"][aria-haspopup="dialog"]');
    await trigger.focus();
    await trigger.click();

    const dialog = page.locator('div[role="dialog"][aria-label="Navigation menu"]');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    const focusedAriaLabel = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ?? null,
    );
    expect(focusedAriaLabel).toBe('Menu');
  });
});
