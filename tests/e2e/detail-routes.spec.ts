import { test, expect } from './fixtures';

/**
 * Functional coverage for the parameterised detail routes. The existing e2e
 * suite tests listing/filter surfaces and a11y across themes, but never drives
 * a real blog-post / project-detail / tag-archive load end-to-end — i.e. the
 * hydration + route-param binding + content render path. A route-param mismatch
 * or a hydration break on these pages would otherwise ship undetected.
 */
test.describe('detail routes', () => {
  test('a blog post renders its content from the slug param', async ({ page }) => {
    const res = await page.goto('/blog/angular-signals-state-management', {
      waitUntil: 'networkidle',
    });
    expect(res?.status()).toBe(200);
    const h1 = page.locator('main h1, article h1, h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
    // The rendered Markdown body should carry real prose, not an error/empty state.
    const bodyText = await page.locator('main').innerText();
    expect(bodyText.length).toBeGreaterThan(400);
    await expect(page.getByText(/failed to load|not found/i)).toHaveCount(0);
  });

  test('a project detail page renders from the slug param', async ({ page }) => {
    const res = await page.goto('/projects/bookstore', { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByText(/not found/i)).toHaveCount(0);
  });

  test('a projects tag archive renders its filtered set', async ({ page }) => {
    await page.goto('/projects/tag/angular', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText(/tagged/i);
    await expect(page.locator('.project-card').first()).toBeVisible();
  });

  test('a deep-linked ?view=grid binds state and survives a back navigation', async ({ page }) => {
    await page.goto('/projects?view=grid', { waitUntil: 'networkidle' });
    await expect(page.locator('.project-card').first()).toBeVisible();
    // The grid view option reflects the query param after hydration.
    await expect(page.getByRole('radio', { name: 'Grid view' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    // Navigate away, then back — the query state must be restored, not dropped.
    await page.goto('/blog', { waitUntil: 'networkidle' });
    await page.goBack({ waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/projects\?(.*&)?view=grid/);
    await expect(page.locator('.project-card').first()).toBeVisible();
  });
});
