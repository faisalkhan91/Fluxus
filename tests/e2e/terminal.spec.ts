import AxeBuilder from '@axe-core/playwright';
import { expect, test, seedTheme, type Theme } from './fixtures';

/**
 * Terminal mode (Ctrl+`) — a native <dialog> console driven by the shared
 * HotkeyService. Proves the open/close journey, command execution
 * (navigation + theme switch), history recall, and that the open overlay is
 * axe-clean (the standing a11y.spec never opens overlays).
 */
const TERMINAL = 'dialog[aria-label="Terminal"]';

async function openTerminal(page: import('@playwright/test').Page) {
  await page.keyboard.press('Control+Backquote');
  await expect(page.locator(TERMINAL)).toBeVisible();
}

test.describe('terminal mode', () => {
  test('Ctrl+` opens the terminal with the input focused', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await openTerminal(page);
    await expect(page.locator('.term-input')).toBeFocused();
  });

  test('`help` prints the command list', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await openTerminal(page);
    await page.locator('.term-input').fill('help');
    await page.keyboard.press('Enter');
    const log = page.locator('[role="log"]');
    await expect(log).toContainText('open');
    await expect(log).toContainText('theme');
  });

  test('`open about` navigates and closes the terminal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await openTerminal(page);
    await page.locator('.term-input').fill('open about');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/about$/);
    // Native <dialog>: stays in the DOM but hidden once closed.
    await expect(page.locator('.term-input')).toBeHidden();
  });

  test('`theme nord` switches the active theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await openTerminal(page);
    await page.locator('.term-input').fill('theme nord');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'nord');
  });

  test('ArrowUp recalls the previous command', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await openTerminal(page);
    const input = page.locator('.term-input');
    await input.fill('whoami');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('');
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('whoami');
  });

  test('Escape closes the terminal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await openTerminal(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.term-input')).toBeHidden();
  });

  for (const theme of ['crimson-dark', 'github-light'] as Theme[]) {
    test(`open terminal has no serious/critical axe violations (${theme})`, async ({ page }) => {
      await seedTheme(page, theme);
      await page.goto('/', { waitUntil: 'networkidle' });
      await openTerminal(page);
      const results = await new AxeBuilder({ page })
        .include(TERMINAL)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(blocking).toEqual([]);
    });
  }
});
