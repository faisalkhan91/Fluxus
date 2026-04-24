import { devices } from '@playwright/test';
import { enableReducedMotion, expect, test } from './fixtures';

/**
 * Asserts the global @media (prefers-reduced-motion: reduce) block in
 * src/styles.css collapses every CSS animation and transition to ~0ms and
 * disables View Transition pseudo-element animations.
 *
 * Without that block these checks fail — that's the point of this spec; it
 * surfaces missing reduced-motion handling for WCAG 2.3.3.
 */
test.use({ ...devices['Desktop Chrome'] });

const ALMOST_ZERO_MS = 5;

test.describe('prefers-reduced-motion: reduce', () => {
  test.beforeEach(async ({ page }) => {
    await enableReducedMotion(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('every element has near-zero transition-duration', async ({ page }) => {
    const slowElements = await page.evaluate((threshold) => {
      const offenders: { selector: string; transition: string; animation: string }[] = [];
      const els = document.querySelectorAll<HTMLElement>('body *');
      for (const el of Array.from(els)) {
        const style = window.getComputedStyle(el);
        const parseDur = (v: string): number => {
          // Computed style returns comma-separated lists for shorthand props.
          const parts = v.split(',').map((s) => s.trim());
          let max = 0;
          for (const p of parts) {
            if (p.endsWith('ms')) max = Math.max(max, parseFloat(p));
            else if (p.endsWith('s')) max = Math.max(max, parseFloat(p) * 1000);
          }
          return max;
        };
        const tDur = parseDur(style.transitionDuration);
        const aDur = parseDur(style.animationDuration);
        if (tDur > threshold || aDur > threshold) {
          offenders.push({
            selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.') : ''),
            transition: style.transitionDuration,
            animation: style.animationDuration,
          });
        }
      }
      return offenders.slice(0, 10); // cap so the failure log stays readable
    }, ALMOST_ZERO_MS);

    if (slowElements.length > 0) {
      const detail = slowElements
        .map((o) => `  • ${o.selector} (transition=${o.transition}, animation=${o.animation})`)
        .join('\n');
      throw new Error(
        `Found ${slowElements.length}+ element(s) with non-zero animation/transition under prefers-reduced-motion:\n${detail}\n` +
          `Add a @media (prefers-reduced-motion: reduce) block to src/styles.css that sets animation-duration / transition-duration to 0.01ms !important.`,
      );
    }
    expect(slowElements).toEqual([]);
  });

  test('::view-transition pseudo-elements have animation disabled', async ({ page }) => {
    // We can't directly query pseudo-elements, but we can verify the rule
    // exists in any of the loaded stylesheets.
    const hasRule = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue; // CORS-blocked external sheet
        }
        for (const rule of Array.from(rules)) {
          if (
            rule instanceof CSSMediaRule &&
            rule.conditionText.includes('prefers-reduced-motion')
          ) {
            for (const inner of Array.from(rule.cssRules)) {
              if (
                inner.cssText.includes('view-transition') &&
                inner.cssText.includes('animation')
              ) {
                return true;
              }
            }
          }
        }
      }
      return false;
    });
    expect(
      hasRule,
      'styles.css must include a prefers-reduced-motion block that disables ::view-transition-* animations',
    ).toBe(true);
  });

  test('navigating with reduced motion does not block the user (URL updates promptly)', async ({
    page,
  }) => {
    // Sanity guard: even if startViewTransition is invoked, the route must
    // resolve quickly. Reduced motion just kills the visual.
    const start = Date.now();
    await page.locator('a[href="/about"]').first().click();
    await page.waitForURL('**/about');
    const elapsed = Date.now() - start;
    // 1s is a generous ceiling — a stuck transition would block much longer.
    expect(elapsed).toBeLessThan(1500);
  });
});
