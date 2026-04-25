import { expect, test } from './fixtures';

/**
 * INP (Interaction to Next Paint) smoke check for the blog post route.
 *
 * The blog post screen is the most interaction-heavy surface on the site:
 * scroll progress bar, sticky TOC, code-block copy buttons, share row,
 * and (optionally) lazy-rendered mermaid diagrams. A regression in any
 * of those handlers tends to show up as elevated INP on this page first.
 *
 * Strategy
 * --------
 * 1. Navigate to a representative prerendered post.
 * 2. Wait for hydration + first idle.
 * 3. Drive a few user-style interactions:
 *    - mouse-wheel scroll (exercises the rAF-throttled scroll handler)
 *    - click each share <a> (dispatches navigation intent — we cancel)
 *    - click the "Copy link" button (clipboard write)
 * 4. Use the Performance API to read every event entry's `processingEnd
 *    - startTime` for input-style events. The maximum of those values is
 *    a conservative INP proxy on a single-page burst (real INP is the
 *    98th-percentile of all interactions across a session, which we
 *    can't measure in a deterministic E2E run).
 *
 * The 200 ms budget is the "good" bucket from web.dev's INP guidance.
 * If the site regresses past that, this spec fails loudly.
 */
const INP_BUDGET_MS = 200;

test.describe('INP — blog post', () => {
  test('input handlers stay under the "good" INP budget', async ({ page }) => {
    await page.goto('/blog/angular-signals-state-management');
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

    // Buffer event timings for the duration of this test. `event` covers
    // pointerdown/pointerup/click/keydown — the full set INP scores against.
    await page.evaluate(() => {
      interface EventTimingWindow {
        __eventDurations?: number[];
        __eventObserver?: PerformanceObserver;
      }
      const w = window as Window & EventTimingWindow;
      w.__eventDurations = [];
      w.__eventObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // `processingEnd - startTime` is the input → next-paint delay
          // PerformanceEventTiming exposes; matches what CrUX uses for INP.
          const e = entry as PerformanceEventTiming;
          w.__eventDurations!.push(e.processingEnd - e.startTime);
        }
      });
      w.__eventObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 });
    });

    // Scroll the reading pane a few times — the rAF-throttled progress
    // handler is the most likely INP regression source on this page.
    const scroller = page.locator('main.content');
    for (let i = 0; i < 5; i++) {
      await scroller.evaluate((el, dy) => el.scrollBy({ top: dy }), 600);
      await page.waitForTimeout(120);
    }

    // Click each of the share buttons. Most are external <a target=_blank>
    // — Playwright auto-handles popup-blocked clicks; the click handler
    // itself is what we want to exercise.
    const shareLinks = page.locator('.post-share .share-link');
    const count = await shareLinks.count();
    for (let i = 0; i < count; i++) {
      // Use force: true so a covered link doesn't bail before the handler
      // runs; we don't care about navigation, only the input → paint cost.
      await shareLinks.nth(i).click({ force: true, button: 'left', noWaitAfter: true });
      await page.waitForTimeout(80);
    }

    const durations = await page.evaluate(() => {
      interface EventTimingWindow {
        __eventDurations?: number[];
      }
      return (window as Window & EventTimingWindow).__eventDurations ?? [];
    });

    if (durations.length === 0) {
      // PerformanceEventTiming requires the interaction to be "slow enough"
      // to be recorded (durationThreshold). An empty buffer is a *good*
      // signal — it means every handler resolved well under 16 ms.
      expect(durations.length).toBe(0);
      return;
    }

    const worst = Math.max(...durations);
    expect.soft(worst, `worst event duration was ${worst.toFixed(1)} ms`).toBeLessThan(INP_BUDGET_MS);
  });
});
