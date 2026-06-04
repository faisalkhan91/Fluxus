import { Service, signal } from '@angular/core';

/**
 * Tracks reading progress (0–100) through the document for the
 * `.reading-progress` bar in `BlogPostComponent`. Extracted from the
 * component so the scroll-driven plumbing lives in one testable place.
 *
 * Sits at the feature layer (not `core/services`) alongside the other
 * blog-post-only services. Root-provided (`@Service()`) is fine — only one
 * blog post renders at a time, and `start()` re-seeds the signal per page.
 */
@Service()
export class ReadingProgressService {
  private readonly _progress = signal(0);

  /** Scroll progress through the document, 0–100. Drives the reading bar. */
  readonly progress = this._progress.asReadonly();

  /**
   * Begin tracking scroll progress and return a disposer. Call from a
   * browser-only context (e.g. `afterNextRender`).
   *
   * No-op (the returned disposer does nothing) on browsers that support CSS
   * scroll-driven animations: there the bar is animated via
   * `animation-timeline: scroll(root)` on the compositor (see styles.css),
   * which is cheaper and always smooth. The JS rAF path below is the
   * fallback for engines without that support and pins to the same
   * document-root scroller so the math matches the CSS exactly.
   */
  start(): () => void {
    const cssScrollDriven =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('animation-timeline: scroll()');
    if (cssScrollDriven) return () => {};

    const scroller = (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
    let rafHandle = 0;
    let scheduled = false;

    const recompute = () => {
      scheduled = false;
      rafHandle = 0;
      const total = scroller.scrollHeight - scroller.clientHeight;
      if (total <= 0) {
        this._progress.set(100);
        return;
      }
      this._progress.set(Math.min(100, (scroller.scrollTop / total) * 100));
    };

    // rAF-throttle: scroll fires faster than the compositor frame on
    // trackpads/wheels, so coalescing to one update per animation frame keeps
    // INP healthy without losing fidelity. The document-root scroller fires
    // scroll events on `window`, not on documentElement.
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      rafHandle = requestAnimationFrame(recompute);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Seed the bar so it reflects any initial scroll restoration (e.g. a
    // back/forward navigation that lands the reader mid-post).
    recompute();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafHandle) cancelAnimationFrame(rafHandle);
    };
  }
}
