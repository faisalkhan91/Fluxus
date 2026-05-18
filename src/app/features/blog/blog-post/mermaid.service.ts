import { Injectable, inject } from '@angular/core';
import { ThemeService } from '@core/services/theme.service';

/**
 * Mermaid diagram lifecycle, extracted from `BlogPostComponent`.
 *
 * Knows how to:
 *  - Schedule a deferred render of `.mermaid-source[data-mermaid-source]`
 *    placeholders into rendered SVG figures (lazy import, idle callback,
 *    Safari setTimeout fallback).
 *  - Revert rendered figures back to source placeholders so the
 *    component can re-trigger `scheduleRender` against the new theme
 *    palette after a theme toggle.
 *
 * The placeholder shape is emitted by `MarkdownService` at parse time:
 * a `<div class="mermaid-source" data-mermaid-source>` whose
 * `textContent` is the raw mermaid source. The render path replaces
 * each placeholder with a `<figure class="mermaid" data-mermaid-source>`
 * containing the SVG; the `data-mermaid-source` attribute is preserved
 * on the figure so a later revert can rebuild the placeholder shape
 * exactly. SSR-safe — every method bails when `window` / `document`
 * are undefined.
 *
 * Sits at the feature layer: `BlogPostComponent` is the only consumer
 * today, but the service itself has no template coupling and could be
 * reused by any future component that wants mermaid in its rendered
 * markdown.
 */
@Injectable({ providedIn: 'root' })
export class MermaidService {
  private theme = inject(ThemeService);

  /**
   * Defer the render until the browser is idle. Uses `requestIdleCallback`
   * when available, falls back to a 200 ms `setTimeout` on Safari (which
   * still ships no idle callback) so the lazy import never blocks the
   * first paint or the first input. No-op on the server.
   */
  scheduleRender(root: HTMLElement): void {
    if (typeof window === 'undefined') return;
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    };
    const w = window as IdleWindow;
    const run = () => void this.renderIfNeeded(root);
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run, { timeout: 1500 });
    } else {
      setTimeout(run, 200);
    }
  }

  /**
   * Walk every `<figure class="mermaid" data-mermaid-source>` inside
   * `root` and rewrite it back to the `<div class="mermaid-source">`
   * placeholder shape. Returns `true` when at least one figure was
   * reverted, so the caller can decide whether to schedule a fresh
   * render with the new theme baked in.
   */
  revertIfRendered(root: HTMLElement): boolean {
    if (typeof document === 'undefined') return false;
    const rendered = Array.from(
      root.querySelectorAll<HTMLElement>('figure.mermaid[data-mermaid-source]'),
    );
    if (rendered.length === 0) return false;
    for (const figure of rendered) {
      const source = figure.getAttribute('data-mermaid-source') ?? '';
      const placeholder = document.createElement('div');
      placeholder.className = 'mermaid-source';
      placeholder.setAttribute('data-mermaid-source', '');
      placeholder.textContent = source;
      figure.replaceWith(placeholder);
    }
    return true;
  }

  /**
   * Lazy-import mermaid, initialise once per render with the current
   * theme's scheme, and replace each placeholder with the rendered SVG.
   * On per-diagram failure: drop `data-mermaid-source` so the source is
   * left visible (matches the no-JS prerender baseline). On lib-load
   * failure: bail silently and leave placeholders intact.
   */
  private async renderIfNeeded(root: HTMLElement): Promise<void> {
    if (typeof window === 'undefined') return;
    const placeholders = Array.from(
      root.querySelectorAll<HTMLElement>('.mermaid-source[data-mermaid-source]'),
    );
    if (placeholders.length === 0) return;
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        // Drive Mermaid's coarse palette from the active theme's scheme,
        // not the literal `data-theme` value — the latter could be any
        // registered id ('solarized-light', 'tokyo-night', …) and the
        // mermaid lib only understands the binary 'default' / 'dark'.
        theme: this.theme.scheme() === 'light' ? 'default' : 'dark',
        securityLevel: 'strict',
      });
      let id = 0;
      for (const node of placeholders) {
        const source = node.textContent ?? '';
        try {
          const { svg } = await mermaid.render(`mermaid-${Date.now()}-${id++}`, source);
          const wrapper = document.createElement('figure');
          wrapper.className = 'mermaid';
          wrapper.innerHTML = svg;
          // Stash the source so a later revert can rebuild the
          // placeholder verbatim and re-render against a new theme.
          wrapper.setAttribute('data-mermaid-source', source);
          node.replaceWith(wrapper);
        } catch {
          // Per-diagram failure: leave the source visible so the reader
          // can still see the diagram intent.
          node.removeAttribute('data-mermaid-source');
        }
      }
    } catch {
      // Lib-load failure (offline, network error). Placeholders stay.
    }
  }
}
