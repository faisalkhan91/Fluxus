import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppErrorHandler } from './app-error-handler';
import { ErrorToastService } from './error-toast.service';

describe('AppErrorHandler', () => {
  let toasts: ErrorToastService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  function createHandler(platformId: 'browser' | 'server' = 'browser'): AppErrorHandler {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    toasts = TestBed.inject(ErrorToastService);
    return TestBed.inject(AppErrorHandler);
  }

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('console logging', () => {
    it('always forwards the error to console.error (even on the server)', () => {
      const handler = createHandler('server');
      const err = new Error('boom');
      handler.handleError(err);
      expect(consoleSpy).toHaveBeenCalledWith(err);
    });

    it('logs before any recovery toast is pushed in the browser', () => {
      const handler = createHandler('browser');
      handler.handleError(new Error('Loading chunk 42 failed'));
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('non-browser guard', () => {
    it('does not push a toast when running on the server', () => {
      const handler = createHandler('server');
      const pushSpy = vi.spyOn(toasts, 'push');
      handler.handleError(new Error('Loading chunk 42 failed'));
      expect(pushSpy).not.toHaveBeenCalled();
    });
  });

  describe('chunk-load failure detection', () => {
    const cases: [string, unknown, boolean][] = [
      ['Loading chunk X failed', new Error('Loading chunk 12 failed'), true],
      ['ChunkLoadError identifier', new Error('ChunkLoadError: something'), true],
      [
        'Failed to fetch dynamically imported module',
        new Error('Failed to fetch dynamically imported module https://cdn/example.js'),
        true,
      ],
      ['Generic TypeError', new TypeError("can't read prop"), false],
      ['Null input', null, false],
      ['Non-Error with chunk-ish message', { message: 'loading bar failed' } as unknown, true],
      ['Primitive string with chunk keyword', 'Loading chunk meta', true],
    ];

    for (const [label, input, expected] of cases) {
      it(`${expected ? 'pushes a toast' : 'stays quiet'} for: ${label}`, () => {
        const handler = createHandler('browser');
        const pushSpy = vi.spyOn(toasts, 'push');
        handler.handleError(input);
        if (expected) {
          expect(pushSpy).toHaveBeenCalledTimes(1);
        } else {
          expect(pushSpy).not.toHaveBeenCalled();
        }
      });
    }
  });

  describe('recovery toast content', () => {
    it('includes a headline, detail, and a Reload action that refreshes the page', () => {
      const handler = createHandler('browser');
      const pushSpy = vi.spyOn(toasts, 'push');
      // jsdom's window.location is read-only; stub reload so the test doesn't
      // actually try to navigate.
      const reload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload },
        configurable: true,
      });

      handler.handleError(new Error('Loading chunk 99 failed'));

      expect(pushSpy).toHaveBeenCalledTimes(1);
      const toast = pushSpy.mock.calls[0][0];
      expect(toast.title).toBeTruthy();
      expect(toast.detail).toBeTruthy();
      expect(toast.actionLabel).toBe('Reload');
      expect(toast.action).toBeTypeOf('function');
      // Chunk-load is the rare blocking failure that should announce
      // assertively (role="alert") via the severity-aware toast region.
      expect(toast.severity).toBe('error');

      toast.action?.();
      expect(reload).toHaveBeenCalledTimes(1);
    });
  });
});
