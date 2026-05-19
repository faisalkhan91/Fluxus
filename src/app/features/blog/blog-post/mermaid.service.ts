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
type IdleHandle =
  | { kind: 'idle'; id: number }
  | { kind: 'timeout'; id: ReturnType<typeof setTimeout> };

@Injectable({ providedIn: 'root' })
export class MermaidService {
  private theme = inject(ThemeService);

  /**
   * Pending idle/timeout handle from the most recent `scheduleRender`.
   * Stored so the next `scheduleRender` can cancel a not-yet-fired
   * deferred run rather than letting both fire (e.g. on rapid blog-post
   * navigation, where the previous post's idle render would otherwise
   * burn a wasted dynamic import against a detached DOM).
   */
  private pendingHandle: IdleHandle | null = null;

  /**
   * In-flight render guard. `renderIfNeeded` sets this for the duration
   * of its async work. While true, a fresh `scheduleRender` flips
   * `restartRequested` instead of kicking off a parallel render — the
   * current pass finishes, then re-runs once with the new theme.
   *
   * Without this, a theme toggle during an in-flight render races: the
   * old render finishes after `revertIfRendered` already rebuilt the
   * placeholders, leaving stale-palette `<figure class="mermaid">`
   * elements in the new-theme document until the next navigation.
   */
  private rendering = false;
  private restartRequested = false;

  /**
   * Defer the render until the browser is idle. Uses `requestIdleCallback`
   * when available, falls back to a 200 ms `setTimeout` on Safari (which
   * still ships no idle callback) so the lazy import never blocks the
   * first paint or the first input. No-op on the server.
   *
   * Coalesces with prior pending schedules: a still-deferred handle is
   * cancelled, and a call made while a render is in flight queues a
   * single restart via `restartRequested` rather than running a second
   * render in parallel.
   */
  scheduleRender(root: HTMLElement): void {
    if (typeof window === 'undefined') return;
    if (this.rendering) {
      this.restartRequested = true;
      return;
    }
    this.cancelPending();
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    const run = () => {
      this.pendingHandle = null;
      void this.runRender(root);
    };
    if (typeof w.requestIdleCallback === 'function') {
      this.pendingHandle = { kind: 'idle', id: w.requestIdleCallback(run, { timeout: 1500 }) };
    } else {
      this.pendingHandle = { kind: 'timeout', id: setTimeout(run, 200) };
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
   * Drop any pending deferred render and clear the restart request.
   * Components call this on destroy so the singleton service doesn't
   * fire an idle callback against a now-detached `root` element.
   * The in-flight `runRender` itself is not cancellable (the async
   * mermaid import doesn't expose abort), but `renderIfNeeded` short-
   * circuits when the root has zero `.mermaid-source` children — and
   * a detached subtree's `querySelectorAll` returns an empty list.
   */
  cancel(): void {
    this.cancelPending();
    this.restartRequested = false;
  }

  private cancelPending(): void {
    if (!this.pendingHandle) return;
    if (typeof window === 'undefined') {
      this.pendingHandle = null;
      return;
    }
    if (this.pendingHandle.kind === 'idle') {
      const w = window as Window & { cancelIdleCallback?: (id: number) => void };
      w.cancelIdleCallback?.(this.pendingHandle.id);
    } else {
      clearTimeout(this.pendingHandle.id);
    }
    this.pendingHandle = null;
  }

  /**
   * Wrapper that toggles `rendering` around `renderIfNeeded` and replays
   * a single deferred restart if `scheduleRender` was called mid-render.
   */
  private async runRender(root: HTMLElement): Promise<void> {
    this.rendering = true;
    try {
      await this.renderIfNeeded(root);
    } finally {
      this.rendering = false;
    }
    if (this.restartRequested) {
      this.restartRequested = false;
      this.scheduleRender(root);
    }
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
          /*
            Fade the placeholder out before the swap so the eye sees a
            cross-fade with the new figure's enter-animation (defined
            in `blog-post.component.css` on `.mermaid`). Pure JS
            because `replaceWith` is a synchronous DOM mutation — we
            can't animate a leaving node via CSS without orchestration.
            150 ms (`--duration-fast`) matches the global exit cadence;
            the await keeps each diagram's swap atomic so subsequent
            diagrams in the loop render without their fade-outs
            stomping each other.

            Reduced-motion users still see the swap, just without the
            fade — the tween collapses to ~0 ms via the global rule on
            the consuming element.
          */
          await this.fadeOut(node);
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

  /**
   * Animate a placeholder to `opacity: 0` before it gets replaced with
   * the rendered SVG. Resolves on `transitionend` or after a 200 ms
   * safety timeout (whichever fires first) — the timeout guards
   * against engines that drop transitionend events when the element
   * is detached mid-transition (older Safari) or where
   * `prefers-reduced-motion` collapses the duration to ~0 ms (in
   * which case `transitionend` may not dispatch reliably across all
   * combinations of devices). Inline-style transition is set here
   * rather than in CSS so the fade-out is orchestration-bound to the
   * swap, not a property of every `.mermaid-source` on the page.
   */
  private fadeOut(node: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      node.addEventListener('transitionend', finish, { once: true });
      // Safety net — see comment above.
      setTimeout(finish, 200);
      node.style.transition = 'opacity 150ms ease-out';
      node.style.opacity = '0';
    });
  }
}
