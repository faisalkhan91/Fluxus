import { test, expect } from './fixtures';

/**
 * /skills end-to-end coverage for the "connective tissue" rework.
 *
 * Two responsibilities:
 *
 * 1. Each skill badge with at least one matching project is rendered as
 *    a clickable card-link to `/projects/tag/<slug>`. Clicking it
 *    navigates to a filtered Projects archive that only shows matching
 *    cards.
 *
 * 2. Skills are first-class entries in the Cmd+K palette: typing the
 *    skill name surfaces a `Skill · N projects · M posts` row that,
 *    on Enter, navigates to the same archive as the badge click.
 *
 * The spec uses `Python` as the canonical positive case because it's
 * the first skill in `Languages & Frameworks`, has multiple matching
 * projects in `projects-data.service.ts`, and a curated `level` so the
 * progress bar also renders. `HTML5` exercises the alias path —
 * canonical slug `html5` but the route resolves to `/projects/tag/html`
 * because that's where the project tags actually point.
 *
 * Updating a project tag spelling (or removing a project) without
 * updating this spec will surface the drift via a deterministic e2e
 * failure rather than a silent dead link on production.
 */
test.describe('/skills connective tissue', () => {
  test('Python badge links to /projects/tag/python and shows only Python projects', async ({
    page,
  }) => {
    await page.goto('/skills', { waitUntil: 'networkidle' });

    // Python is the first skill in Languages & Frameworks, always above
    // the topN truncation cut. Filtering by name keeps the selector
    // resilient to category re-ordering as the catalog grows.
    const pythonBadge = page
      .locator('ui-skill-badge', { hasText: 'Python' })
      .first();
    await expect(pythonBadge).toBeVisible();

    const projectsLink = pythonBadge.locator('a.badge-card-link');
    await expect(projectsLink).toHaveAttribute('href', '/projects/tag/python');

    await projectsLink.click();
    await page.waitForURL('**/projects/tag/python');

    const titles = page.locator('.project-title');
    await expect(titles.first()).toBeVisible();
    await expect(page.locator('h1')).toContainText('Projects tagged');

    // Every visible card must list "Python" among its tags. Reading the
    // tag chips per card avoids assuming a specific filter implementation.
    const cards = page.locator('.project-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    for (let i = 0; i < cardCount; i++) {
      const tagTexts = await cards.nth(i).locator('.tag').allTextContents();
      const lower = tagTexts.map((t) => t.toLowerCase());
      expect(lower).toContain('python');
    }
  });

  test('HTML5 badge routes to /projects/tag/html via the alias', async ({ page }) => {
    await page.goto('/skills', { waitUntil: 'networkidle' });

    // HTML5 sits at position 8 in `Languages & Frameworks`, below the
    // desktop topN cut of 5. Expand the section first so the badge is
    // attached to the DOM and visible.
    const languagesSection = page.locator('section.skill-section', {
      hasText: 'Languages & Frameworks',
    });
    await languagesSection.locator('button.expand-toggle').click();

    const htmlBadge = page.locator('ui-skill-badge', { hasText: 'HTML5' }).first();
    await expect(htmlBadge).toBeVisible();
    const link = htmlBadge.locator('a.badge-card-link');
    // The skill's canonical slug is `html5`, but the alias resolves the
    // route to `html` because that's where the project tags point. This
    // is the contract for the alias-driven route slug behaviour in
    // `SkillUsageService.usageBySlug`.
    await expect(link).toHaveAttribute('href', '/projects/tag/html');
  });

  test('skills with zero project matches render as static (non-link) cards', async ({ page }) => {
    await page.goto('/skills', { waitUntil: 'networkidle' });

    // Both `Go` and `AWS` are seeded as skills but no project tags
    // reference them, so the badges must render as plain cards (no
    // anchor). They're picked specifically because they sit in the top
    // 3 of their categories — the contract holds at any viewport
    // width without needing to expand the truncated lists first.
    for (const orphan of ['Go', 'AWS']) {
      const badge = page.locator('ui-skill-badge', { hasText: orphan }).first();
      await expect(badge).toBeVisible();
      const links = await badge.locator('a.badge-card-link').count();
      expect(links).toBe(0);
    }
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
    // Filter to the Python skill row; the catalog also surfaces the
    // sidebar Projects entry plus blog posts, so we constrain by both
    // the visible label and the "Skill ·" hint to land on the skill row.
    await input.fill('Python');

    const skillRow = page
      .locator('.palette-item')
      .filter({ has: page.locator('.palette-label', { hasText: /^Python$/ }) })
      .filter({ has: page.locator('.palette-hint', { hasText: /^Skill ·/ }) })
      .first();
    await expect(skillRow).toBeVisible();
    await expect(skillRow.locator('.palette-hint')).toContainText('project');

    // Find the skill row's index among the filtered list and arrow
    // down to it. Using arrow keys keeps the activation path identical
    // to a real user (highlighted row → Enter) rather than triggering
    // a click handler the production code doesn't drive.
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

    // The palette starts highlighted at index 0; press ArrowDown until
    // we reach the skill row, then Enter to route.
    for (let i = 0; i < skillIndex; i++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('Enter');

    await page.waitForURL('**/projects/tag/python');
    await expect(page.locator('h1')).toContainText('Projects tagged');
  });
});
