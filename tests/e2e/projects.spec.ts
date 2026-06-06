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
    // Grid is opt-in via `?view=grid` now; list is the landing default.
    await page.goto('/projects?view=grid', { waitUntil: 'networkidle' });

    const firstCard = page.locator('.project-card').first();
    await expect(firstCard).toBeVisible();

    // Tag chips render via the `ui-tag` component (host class `.ui-tag`,
    // selector `a[uiTag]`) since the pill refactor — not a bare `.tag`.
    const firstTag = firstCard.locator('a.ui-tag').first();
    const tagText = (await firstTag.textContent())?.trim().toLowerCase();
    const href = await firstTag.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href!.startsWith('/projects/tag/')).toBe(true);
    expect(href!.split('/').at(-1)).toContain(tagText ?? '');

    await firstTag.click();
    await page.waitForURL('**/projects/tag/**');
    await expect(page.locator('h1')).toContainText('Projects tagged');
  });

  test('each card carries id="project-<slug>" for hash-link deep targeting', async ({ page }) => {
    await page.goto('/projects?view=grid', { waitUntil: 'networkidle' });

    const ids = await page
      .locator('.project-card')
      .evaluateAll((els) => els.map((el) => el.getAttribute('id')));
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id).toBeTruthy();
      expect(id!.startsWith('project-')).toBe(true);
    }
  });

  test('sort controls reorder the grid and persist the choice in the URL', async ({ page }) => {
    await page.goto('/projects?view=grid', { waitUntil: 'networkidle' });
    const initial = await page.locator('.project-title').allTextContents();

    await page.getByRole('radio', { name: 'A–Z' }).click();
    await expect(page).toHaveURL(/sort=alpha/);
    const alpha = await page.locator('.project-title').allTextContents();
    // "A-Z" order must differ from the catalog order for our seed set
    // (Backtracking, Bookstore, Dictionary, Insecure, Jenkins, Storm).
    expect(alpha).not.toEqual(initial);
    expect(alpha[0].localeCompare(alpha[1])).toBeLessThan(0);

    // Returning to Featured scrubs `?sort=` but keeps `?view=grid`.
    await page.getByRole('radio', { name: 'Featured' }).click();
    await expect(page).not.toHaveURL(/sort=/);
  });

  test('view toggle — list is the default; grid sticks; sort persists across both', async ({
    page,
  }) => {
    // Landing on /projects?sort=stars lands in list view (no `?view=`).
    await page.goto('/projects?sort=stars', { waitUntil: 'networkidle' });
    await expect(page.locator('.projects-list')).toBeVisible();
    await expect(page.locator('.projects-grid')).toHaveCount(0);

    // Flipping to grid writes `?view=grid` while preserving `?sort=stars`.
    await page.getByRole('radio', { name: 'Grid view' }).click();
    await expect(page).toHaveURL(/\?sort=stars&view=grid|\?view=grid&sort=stars/);
    await expect(page.locator('.projects-grid')).toBeVisible();
    await expect(page.locator('.projects-list')).toHaveCount(0);

    // Going back to list scrubs `?view=` but keeps `?sort=`.
    await page.getByRole('radio', { name: 'List view' }).click();
    await expect(page).toHaveURL(/\?sort=stars$/);
    await expect(page.locator('.projects-list')).toBeVisible();
    await expect(page.locator('.projects-grid')).toHaveCount(0);

    // In list view the featured projects render as heroes and the rest
    // as compact rows under a "More work" heading.
    const heroCount = await page.locator('.projects-list-hero').count();
    expect(heroCount).toBeGreaterThan(0);
    await expect(page.locator('.projects-list-more-heading')).toBeVisible();
  });

  test('list-view compact row links to the detail page', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'networkidle' });
    // No `?view=` → list is default → compact rows are visible.
    const firstRow = page.locator('.projects-list-row').first();
    const titleLink = firstRow.locator('.projects-list-row-title a');

    // Each row also carries a left-aligned thumbnail wrapped in the
    // same detail-page link — the media anchor + the title anchor
    // both point at `/projects/:slug`. The thumbnail sits at
    // tabindex=-1 so keyboard users don't double-tab the title.
    const media = firstRow.locator('.projects-list-row-media');
    await expect(media).toBeVisible();
    const mediaHref = await media.getAttribute('href');
    const titleHref = await titleLink.getAttribute('href');
    expect(mediaHref).toBeTruthy();
    expect(mediaHref).toBe(titleHref);
    await expect(media.locator('img')).toBeVisible();

    await titleLink.click();
    await page.waitForURL(/\/projects\/[^/]+$/);
    await expect(page.locator('.detail-breadcrumb')).toBeVisible();
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
