import { test, expect } from './fixtures';

/**
 * /projects end-to-end coverage for the skills-as-hub closure.
 *
 * Mirrors `skills.spec.ts` — one spec asserts the page's own
 * interactive surface, a second asserts the palette integration.
 *
 * Bookstore is the canonical fixture because it's the first card
 * rendered on `/projects` and its tags (`Angular`, `TypeScript`,
 * `HTML`, `CSS`) overlap with the Skills catalog, so a tag click
 * lands on a non-empty archive. Swapping the data to a project
 * without those tags will surface the drift via a deterministic
 * failure rather than a silent dead link.
 */
test.describe('/projects connective tissue', () => {
  test('tag chips on a card link to /projects/tag/<slug>', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'networkidle' });

    const firstCard = page.locator('.project-card').first();
    await expect(firstCard).toBeVisible();

    const firstTag = firstCard.locator('a.tag').first();
    const tagText = (await firstTag.textContent())?.trim().toLowerCase();
    const href = await firstTag.getAttribute('href');
    // Slugify collapses non-alphanumerics to a single dash. The chip
    // URL must start with `/projects/tag/` and encode the tag text.
    expect(href).toBeTruthy();
    expect(href!.startsWith('/projects/tag/')).toBe(true);
    expect(href!.split('/').at(-1)).toContain(tagText ?? '');

    await firstTag.click();
    await page.waitForURL('**/projects/tag/**');
    await expect(page.locator('h1')).toContainText('Projects tagged');
  });

  test('each card carries id="project-<slug>" for hash-link deep targeting', async ({
    page,
  }) => {
    await page.goto('/projects', { waitUntil: 'networkidle' });

    const ids = await page.locator('.project-card').evaluateAll((els) =>
      els.map((el) => el.getAttribute('id')),
    );
    // All cards must have an id, and all ids must start with `project-`.
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id).toBeTruthy();
      expect(id!.startsWith('project-')).toBe(true);
    }
  });

  test('sort controls reorder the grid and persist the choice in the URL', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'networkidle' });
    const initial = await page.locator('.project-title').allTextContents();

    await page.getByRole('radio', { name: 'A–Z' }).click();
    await expect(page).toHaveURL(/\?sort=alpha/);
    const alpha = await page.locator('.project-title').allTextContents();
    // "A-Z" order must differ from the catalog order for our seed set
    // (Backtracking, Bookstore, Dictionary, Insecure, Jenkins, Storm).
    expect(alpha).not.toEqual(initial);
    expect(alpha[0].localeCompare(alpha[1])).toBeLessThan(0);

    // Returning to Featured scrubs the param rather than leaving
    // `?sort=featured` dangling.
    await page.getByRole('radio', { name: 'Featured' }).click();
    await expect(page).not.toHaveURL(/\?sort=/);
  });
});

test.describe('home page featured projects strip', () => {
  test('surfaces featured projects linking to their detail pages', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Projects strip lives under .featured-projects — below the blog row.
    const strip = page.locator('.featured-projects');
    await expect(strip).toBeVisible();

    const links = strip.locator('.latest-post-link');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);

    const href = await links.first().getAttribute('href');
    expect(href).toBeTruthy();
    expect(href!.startsWith('/projects/')).toBe(true);
    expect(href).not.toBe('/projects');

    await links.first().click();
    await page.waitForURL(/\/projects\/[^/]+$/);
    await expect(page.locator('.detail-breadcrumb')).toBeVisible();
  });
});

test.describe('command palette → project navigation', () => {
  test('typing a project title surfaces the Project row and Enter lands on the detail page', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.keyboard.press('Control+K');
    const input = page.locator('.palette-input');
    await expect(input).toBeFocused();
    await input.fill('Bookstore');

    const projectRow = page
      .locator('.palette-item')
      .filter({ has: page.locator('.palette-label', { hasText: /^Bookstore$/ }) })
      .filter({ has: page.locator('.palette-hint', { hasText: /^Project/ }) })
      .first();
    await expect(projectRow).toBeVisible();

    // Find the project row's index in the filtered list and arrow down
    // to activate it. Mirrors the skills-palette spec pattern.
    const items = page.locator('.palette-item');
    const total = await items.count();
    let projectIndex = -1;
    for (let i = 0; i < total; i++) {
      const hint = (await items.nth(i).locator('.palette-hint').textContent())?.trim() ?? '';
      const label = (await items.nth(i).locator('.palette-label').textContent())?.trim() ?? '';
      if (hint.startsWith('Project') && label === 'Bookstore') {
        projectIndex = i;
        break;
      }
    }
    expect(projectIndex).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < projectIndex; i++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('Enter');

    await page.waitForURL(/\/projects\/bookstore$/);
    await expect(page.locator('h1')).toContainText('Bookstore');
    await expect(page.locator('.detail-breadcrumb')).toBeVisible();
  });
});
