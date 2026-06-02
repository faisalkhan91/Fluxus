import { expect, test } from './fixtures';

/**
 * The command palette (Cmd/Ctrl+K) is a combobox/listbox: focus stays on
 * the input and arrow keys move `aria-activedescendant` rather than DOM
 * focus. Unit tests cover the catalog + scroll-into-view in isolation;
 * theme.spec proves the theme-switch path. These tests prove the core
 * keyboard journey — open, filter, arrow, Enter-to-navigate — end to end.
 */
test.describe('command palette — keyboard navigation', () => {
  test('Ctrl/Cmd+K opens the palette with the search input focused', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+K');
    await expect(page.locator('.palette-input')).toBeFocused();
  });

  test('typing a route query and pressing Enter navigates to that route', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+K');
    const input = page.locator('.palette-input');
    await input.fill('about');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/about$/);
  });

  test('ArrowDown advances the active descendant before Enter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+K');
    const input = page.locator('.palette-input');
    // A broad query so the listbox holds several options. Wait for the
    // filtered list to settle (≥2 options) and for the active descendant
    // to point at the first one before driving the arrow key — reading it
    // before the computed list recomputes is a race.
    await input.fill('a');
    await expect(page.locator('.palette-list li[role="option"]').nth(1)).toBeAttached();
    await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
    const firstActive = await input.getAttribute('aria-activedescendant');
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(async () => input.getAttribute('aria-activedescendant'))
      .not.toBe(firstActive);
  });

  test('Escape closes the palette', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+K');
    await expect(page.locator('.palette-input')).toBeFocused();
    await page.keyboard.press('Escape');
    // The palette is a native <dialog>: its contents stay in the DOM but
    // become hidden when it closes, so assert visibility, not presence.
    await expect(page.locator('.palette-input')).toBeHidden();
  });
});
