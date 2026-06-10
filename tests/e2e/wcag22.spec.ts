import { test, expect } from './fixtures';

/**
 * WCAG 2.2 checks that axe-core does NOT cover (its only 2.2 rule, target-size,
 * is off by default, and focus-appearance/obscured have no automated rule at
 * all). These assertions exercise the concrete, measurable parts directly.
 *
 * Scope note: SC 2.5.8 (target size, 24x24 minimum) has an "inline" exception
 * for links inside a text block, so this targets discrete controls (the project
 * sort/view radios and code-block copy buttons), not prose links.
 */
const MIN_TARGET = 24;
// Sub-pixel tolerance: layout can land a control at e.g. 23.98px.
const TOLERANCE = 0.5;

test.describe('WCAG 2.2 — target size (2.5.8)', () => {
  test('project sort + view controls are at least 24x24', async ({ page }) => {
    await page.goto('/projects?view=grid', { waitUntil: 'networkidle' });
    for (const selector of ['.projects-sort-option', '.projects-view-option']) {
      const controls = page.locator(selector);
      const count = await controls.count();
      expect(count, `${selector} should render controls`).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const box = await controls.nth(i).boundingBox();
        expect(box, `${selector}[${i}] has a box`).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(MIN_TARGET - TOLERANCE);
        expect(box!.height).toBeGreaterThanOrEqual(MIN_TARGET - TOLERANCE);
      }
    }
  });

  test('code-block copy buttons are at least 24x24', async ({ page }) => {
    await page.goto('/blog/angular-signals-state-management', { waitUntil: 'networkidle' });
    const copy = page.locator('.copy-btn');
    const count = await copy.count();
    expect(count, 'sample post has code blocks with copy buttons').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await copy.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(MIN_TARGET - TOLERANCE);
      expect(box!.height).toBeGreaterThanOrEqual(MIN_TARGET - TOLERANCE);
    }
  });
});

test.describe('WCAG 2.2 — focus visibility (2.4.11 / 2.4.13)', () => {
  test('the first Tab reveals the skip link in the viewport', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const activeClass = await page.evaluate(() => document.activeElement?.className ?? '');
    expect(activeClass).toContain('skip-link');
    // Off-screen at rest, the skip link slides into the viewport on focus so a
    // keyboard user can see and use it — i.e. focus is not obscured/hidden.
    // Poll because the slide-in is a CSS transition (a one-shot read can catch
    // it mid-animation while top is still negative).
    const skip = page.locator('.skip-link').first();
    await expect
      .poll(async () => (await skip.boundingBox())?.y ?? -1, { timeout: 2000 })
      .toBeGreaterThanOrEqual(0);
  });
});
