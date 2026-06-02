import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MermaidService } from './mermaid.service';
import { ThemeService } from '@core/services/theme.service';

/**
 * Stub the lazy `import('mermaid')` so the spec doesn't try to load
 * the real lib. The render path is exercised in two of the tests via
 * controlled timing — `mockedRender` is the deferred Promise the
 * service awaits during a render pass; resolving it lets the test
 * step the in-flight render to completion.
 */
const mockedInitialize = vi.fn();
let resolveRender: ((value: { svg: string }) => void) | null = null;
const mockedRender = vi.fn().mockImplementation(
  () =>
    new Promise<{ svg: string }>((resolve) => {
      resolveRender = resolve;
    }),
);

vi.mock('mermaid', () => ({
  default: {
    initialize: (...args: unknown[]) => mockedInitialize(...args),
    render: (...args: unknown[]) => mockedRender(...args),
  },
}));

function makeFigure(source: string): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'mermaid';
  figure.setAttribute('data-mermaid-source', source);
  figure.innerHTML = '<svg>previous render</svg>';
  return figure;
}

function makePlaceholder(source: string): HTMLElement {
  const div = document.createElement('div');
  div.className = 'mermaid-source';
  div.setAttribute('data-mermaid-source', '');
  div.textContent = source;
  return div;
}

describe('MermaidService', () => {
  let service: MermaidService;

  beforeEach(() => {
    mockedInitialize.mockClear();
    mockedRender.mockClear();
    resolveRender = null;
    TestBed.configureTestingModule({
      providers: [MermaidService, { provide: ThemeService, useValue: { scheme: signal('dark') } }],
    });
    service = TestBed.inject(MermaidService);
  });

  describe('revertIfRendered', () => {
    it('returns false when no rendered figures are present', () => {
      const root = document.createElement('div');
      expect(service.revertIfRendered(root)).toBe(false);
    });

    it('rebuilds each rendered figure as a .mermaid-source placeholder', () => {
      const root = document.createElement('div');
      root.appendChild(makeFigure('graph A; A-->B;'));
      root.appendChild(makeFigure('flowchart TD; X[Y];'));

      expect(service.revertIfRendered(root)).toBe(true);

      const placeholders = root.querySelectorAll<HTMLElement>(
        '.mermaid-source[data-mermaid-source]',
      );
      expect(placeholders).toHaveLength(2);
      expect(placeholders[0].textContent).toBe('graph A; A-->B;');
      expect(placeholders[1].textContent).toBe('flowchart TD; X[Y];');
      expect(root.querySelectorAll('figure.mermaid')).toHaveLength(0);
    });

    it('skips figures missing the data-mermaid-source attribute', () => {
      const root = document.createElement('div');
      root.appendChild(makeFigure('A-->B;'));
      const untagged = document.createElement('figure');
      untagged.className = 'mermaid';
      untagged.innerHTML = 'no source attr';
      root.appendChild(untagged);

      service.revertIfRendered(root);

      expect(root.querySelectorAll('figure.mermaid')).toHaveLength(1);
      expect(root.querySelector('figure.mermaid')?.innerHTML).toBe('no source attr');
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('clears a still-pending timeout so the deferred render never fires', () => {
      const root = document.createElement('div');
      root.appendChild(makePlaceholder('A-->B;'));

      service.scheduleRender(root);
      service.cancel();
      vi.runAllTimers();

      // Pending was cancelled so renderIfNeeded never reached the
      // mermaid mock — no `mermaid.render()` call.
      expect(mockedRender).not.toHaveBeenCalled();
    });

    it('drops a queued restart so a destroyed component does not retrigger a render', async () => {
      const root = document.createElement('div');
      root.appendChild(makePlaceholder('A-->B;'));

      // Kick off an in-flight render — it awaits resolveRender.
      service.scheduleRender(root);
      await vi.runAllTimersAsync();
      // While in flight, request a restart and then immediately cancel.
      service.scheduleRender(root);
      service.cancel();
      // Resolve the original render.
      resolveRender?.({ svg: '<svg></svg>' });
      await vi.runAllTimersAsync();

      // The in-flight render finished (1 call). The restart that
      // would have replayed `scheduleRender` was cancelled, so no
      // second mermaid.render call.
      expect(mockedRender).toHaveBeenCalledTimes(1);
    });
  });

  describe('scheduleRender — coalescing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('cancels a still-pending timeout handle when scheduled again before fire', () => {
      // jsdom has no requestIdleCallback so the service uses the
      // setTimeout fallback path — clearTimeout is the cancellation
      // we can observe.
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
      const root = document.createElement('div');

      service.scheduleRender(root);
      expect(clearSpy).not.toHaveBeenCalled();

      // Second schedule must clear the first pending handle so the
      // deferred render only fires once.
      service.scheduleRender(root);
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    it('does nothing when called with no .mermaid-source placeholders', async () => {
      const root = document.createElement('div');
      service.scheduleRender(root);
      vi.runAllTimers();
      // The deferred run hits renderIfNeeded which short-circuits at
      // `placeholders.length === 0`. Mermaid lib must never load.
      await Promise.resolve();
      expect(mockedInitialize).not.toHaveBeenCalled();
      expect(mockedRender).not.toHaveBeenCalled();
    });
  });

  describe('scheduleRender — restart during in-flight render', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('replaces a placeholder with a rendered figure on a clean run', async () => {
      const root = document.createElement('div');
      root.appendChild(makePlaceholder('A-->B;'));

      service.scheduleRender(root);
      // `runAllTimersAsync` flushes pending microtasks too — without it,
      // the dynamic `await import('mermaid')` never resolves under fake
      // timers, leaving `mermaid.render(...)` uncalled.
      await vi.runAllTimersAsync();
      // Resolve the in-flight render promise that the mock left pending.
      resolveRender?.({ svg: '<svg id="rendered"></svg>' });
      await vi.runAllTimersAsync();

      const figures = root.querySelectorAll('figure.mermaid');
      expect(figures).toHaveLength(1);
      expect(figures[0].getAttribute('data-mermaid-source')).toBe('A-->B;');
      expect(root.querySelectorAll('.mermaid-source[data-mermaid-source]')).toHaveLength(0);
    });

    it('coalesces mid-render schedules into ONE restart (no parallel renders)', async () => {
      const root = document.createElement('div');
      root.appendChild(makePlaceholder('A-->B;'));

      service.scheduleRender(root);
      await vi.runAllTimersAsync();
      expect(mockedRender).toHaveBeenCalledTimes(1);

      // Two schedules during the in-flight render must NOT spawn parallel
      // renders — they coalesce into a single `restartRequested`.
      service.scheduleRender(root);
      service.scheduleRender(root);
      expect(mockedRender).toHaveBeenCalledTimes(1);
    });

    it('restart reverts mid-pass figures and re-renders them (theme-toggle correctness)', async () => {
      // Regression for the theme-toggle-during-render race: a figure
      // produced mid-pass is no longer a `.mermaid-source` placeholder, so
      // a bare restart would skip it and leave a stale-palette diagram. The
      // restart must revert EVERY figure and re-render the whole set.
      const root = document.createElement('div');
      root.appendChild(makePlaceholder('A-->B;'));

      service.scheduleRender(root);
      await vi.runAllTimersAsync();
      expect(mockedRender).toHaveBeenCalledTimes(1);

      // Simulate a theme toggle landing mid-render (the component would call
      // revertIfRendered + scheduleRender; here the in-flight figure hasn't
      // been created yet, so just request the restart).
      service.scheduleRender(root);

      // Resolve the in-flight render → figure created with the OLD palette.
      resolveRender?.({ svg: '<svg id="first"></svg>' });
      await vi.runAllTimersAsync();
      // The restart reverted that figure and re-rendered it: a SECOND render.
      expect(mockedRender).toHaveBeenCalledTimes(2);

      // Resolve the restart's render; end state is exactly one figure with
      // no orphaned placeholder left behind.
      resolveRender?.({ svg: '<svg id="second"></svg>' });
      await vi.runAllTimersAsync();
      expect(root.querySelectorAll('figure.mermaid')).toHaveLength(1);
      expect(root.querySelectorAll('.mermaid-source[data-mermaid-source]')).toHaveLength(0);
    });
  });
});
