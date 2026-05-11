import { test, expect } from './fixtures';

/**
 * /skills end-to-end coverage for the feature-strip + uniform-grid
 * composition.
 *
 * Responsibilities:
 *
 * 1. Core skills surface on the `// core stack` feature strip and link
 *    to `/projects/tag/<slug>` via `SkillUsageService.usageBySlug`.
 *    Python is the canonical positive case.
 *
 * 2. Per-category grid tiles preserve card-link routing for any skill
 *    with matching projects (via name or alias). `HTML5` exercises the
 *    alias path — canonical slug `html5` but the route resolves to
 *    `/projects/tag/html`.
 *
 * 3. Skills with zero matching projects render as static (non-link)
 *    tiles. `Go` is the orphan canary.
 *
 * 4. View-mode toggle (icon-only Grid / List buttons beside the H1)
 *    swaps the DOM between the strip+grid composition and a flat
 *    semantic table.
 *
 * 5. The Cmd+K palette still surfaces skill rows and routes to the
 *    same archive on Enter — independent of which view mode is active.
 */
test.describe('/skills connective tissue', () => {
  test('Python feature card links to /projects/tag/python and filters the archive', async ({
    page,
  }) => {
    await page.goto('/skills', { waitUntil: 'networkidle' });

    // Feature strip holds the page's core skills; Python is the first
    // entry in catalog order.
    const python = page.locator('app-skill-feature-card', { hasText: 'Python' }).first();
    await expect(python).toBeVisible();

    const link = python.locator('a.feature-card-anchor');
    await expect(link).toHaveAttribute('href', '/projects/tag/python');

    await link.click();
    await page.waitForURL('**/projects/tag/python');
    await expect(page.locator('h1')).toContainText('Projects tagged');

    const cards = page.locator('.project-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    for (let i = 0; i < cardCount; i++) {
      const tagTexts = await cards.nth(i).locator('.tag').allTextContents();
      const lower = tagTexts.map((t) => t.toLowerCase());
      expect(lower).toContain('python');
    }
  });

  test('HTML5 grid tile routes to /projects/tag/html via the alias', async ({ page }) => {
    await page.goto('/skills', { waitUntil: 'networkidle' });

    const languagesSection = page.locator('section.skill-section', {
      hasText: 'Languages & Frameworks',
    });
    await languagesSection.locator('button.expand-toggle').click();

    const htmlBadge = page.locator('ui-skill-badge', { hasText: 'HTML5' }).first();
    await expect(htmlBadge).toBeVisible();
    const link = htmlBadge.locator('a.badge-card-link');
    await expect(link).toHaveAttribute('href', '/projects/tag/html');
    // The anchor is visually empty in iteration 4 — the tile itself
    // is the visible target. Semantics live on the aria-label.
    await expect(link).toHaveAttribute('aria-label', /HTML5/);
  });

  test('learning-tier grid tiles get the dimmed class (0 linked projects)', async ({ page }) => {
    await page.goto('/skills', { waitUntil: 'networkidle' });

    // Grid tiles stay uniform — no coloured borders, no caption pills.
    // The only differentiation is that tiles with zero linked projects
    // render at `opacity: 0.62` via the `.dimmed` class. Pick a known
    // orphan skill that consistently has no matching project tags.
    const rustTile = page.locator('ui-skill-badge', { hasText: 'Rust' }).first();
    await expect(rustTile).toBeVisible();
    await expect(rustTile.locator('.dimmed')).toBeVisible();
  });

  test('skills with zero project matches render as static (non-link) tiles', async ({ page }) => {
    await page.goto('/skills', { waitUntil: 'networkidle' });

    const goBadge = page.locator('ui-skill-badge', { hasText: /^\s*Go\s*$/ }).first();
    await expect(goBadge).toBeVisible();
    const goLinks = await goBadge.locator('a.badge-card-link').count();
    expect(goLinks).toBe(0);
  });

  test('view-mode toggle swaps the grid composition for a semantic table', async ({ page }) => {
    await page.goto('/skills', { waitUntil: 'networkidle' });

    // Default = grid: feature strip + category sections visible, no table.
    await expect(page.locator('app-skill-feature-card').first()).toBeVisible();
    await expect(page.locator('table.skills-table')).toHaveCount(0);

    await page.getByRole('button', { name: 'List view' }).click();

    const table = page.locator('table.skills-table');
    await expect(table).toBeVisible();
    await expect(page.locator('app-skill-feature-card')).toHaveCount(0);

    const pythonRow = table.locator('tr', { hasText: 'Python' }).first();
    await expect(pythonRow.locator('.tier-pill')).toHaveText(/core/i);
    await expect(pythonRow.locator('a.row-link')).toHaveAttribute('href', '/projects/tag/python');

    await page.getByRole('button', { name: 'Grid view' }).click();
    await expect(page.locator('app-skill-feature-card').first()).toBeVisible();
    await expect(page.locator('table.skills-table')).toHaveCount(0);
  });
});

test.describe('command palette → skill navigation', () => {
  test('Cmd+K → typing a skill name surfaces the Skill row, Enter routes to projects/tag', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.keyboard.press('Control+K');
    const input = page.locator('.palette-input');
    await expect(input).toBeFocused();
    await input.fill('Python');

    const skillRow = page
      .locator('.palette-item')
      .filter({ has: page.locator('.palette-label', { hasText: /^Python$/ }) })
      .filter({ has: page.locator('.palette-hint', { hasText: /^Skill ·/ }) })
      .first();
    await expect(skillRow).toBeVisible();
    await expect(skillRow.locator('.palette-hint')).toContainText('project');

    const items = page.locator('.palette-item');
    const total = await items.count();
    let skillIndex = -1;
    for (let i = 0; i < total; i++) {
      const hint = (await items.nth(i).locator('.palette-hint').textContent())?.trim() ?? '';
      const label = (await items.nth(i).locator('.palette-label').textContent())?.trim() ?? '';
      if (hint.startsWith('Skill ·') && label === 'Python') {
        skillIndex = i;
        break;
      }
    }
    expect(skillIndex).toBeGreaterThanOrEqual(0);

    for (let i = 0; i < skillIndex; i++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('Enter');

    await page.waitForURL('**/projects/tag/python');
    await expect(page.locator('h1')).toContainText('Projects tagged');
  });
});
