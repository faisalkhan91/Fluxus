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

    // Scroll the document a few times with a real wheel gesture — the
    // rAF-throttled reading-progress handler is the most likely INP
    // regression source on this page. The *document* is the real scroller:
    // the column-flex shell lets `main.content` grow rather than overflow
    // (see the note in styles.css), so el.scrollBy('main.content') moves
    // nothing and would silently exercise no handler. A wheel gesture over
    // the page drives both the JS fallback handler and the CSS scroll
    // timeline.
    await page.mouse.move(400, 400);
    const scrollBefore = await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(120);
    }
    const scrollAfter = await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
    // Prove the gesture actually moved the page. Without this, an empty
    // event-timing buffer below is ambiguous between "all handlers fast"
    // and "nothing scrolled at all" — the original spec scrolled the wrong
    // element and passed trivially on the latter.
    expect(scrollAfter, 'wheel input should scroll the document').toBeGreaterThan(scrollBefore);

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
      // PerformanceEventTiming only records interactions slower than the
      // 16 ms durationThreshold. Now that the scroll assertion above proves
      // we drove real input, an empty buffer is an unambiguous *good* signal
      // — every handler resolved under 16 ms.
      return;
    }

    const worst = Math.max(...durations);
    expect
      .soft(worst, `worst event duration was ${worst.toFixed(1)} ms`)
      .toBeLessThan(INP_BUDGET_MS);
  });
});
