import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

interface Metric {
  name: string;
  value: number;
  id: string;
  rating?: string;
}
type Handler = (metric: Metric) => void;

const registered: Partial<Record<'onCLS' | 'onINP' | 'onLCP' | 'onFCP' | 'onTTFB', Handler>> = {};

vi.mock('web-vitals', () => ({
  onCLS: (cb: Handler) => {
    registered.onCLS = cb;
  },
  onINP: (cb: Handler) => {
    registered.onINP = cb;
  },
  onLCP: (cb: Handler) => {
    registered.onLCP = cb;
  },
  onFCP: (cb: Handler) => {
    registered.onFCP = cb;
  },
  onTTFB: (cb: Handler) => {
    registered.onTTFB = cb;
  },
}));

import { WebVitalsService } from './web-vitals.service';

function resetRegistered(): void {
  registered.onCLS = undefined;
  registered.onINP = undefined;
  registered.onLCP = undefined;
  registered.onFCP = undefined;
  registered.onTTFB = undefined;
}

/*
  The service schedules its dynamic-import registration via
  `requestIdleCallback` (so the work doesn't compete with the LCP frame
  in production). For tests we need that callback to fire synchronously,
  otherwise we'd be polling jsdom for ~50ms between calling `start()`
  and seeing handlers registered. We patch the global before importing
  the service module loads it, and we await a microtask after
  `start()` returns to flush the dynamic import promise that runs
  inside the (now synchronous) idle callback.
*/
async function flushStart(starter: () => void): Promise<void> {
  starter();
  // The service schedules via the patched-synchronous
  // `requestIdleCallback`, which immediately invokes `register()` —
  // and that `await import('web-vitals')` chain resolves through
  // several microtask ticks even with `vi.mock`. `dynamicImportSettled`
  // is Vitest's first-class hook for "wait for every in-flight dynamic
  // import to resolve" and is purpose-built for exactly this case.
  await vi.dynamicImportSettled();
}

describe('WebVitalsService', () => {
  beforeEach(() => {
    resetRegistered();
    // Run idle callbacks immediately so tests stay synchronous-ish.
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      writable: true,
      value: (cb: IdleRequestCallback): number => {
        cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
        return 0;
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('browser platform', () => {
    let service: WebVitalsService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(WebVitalsService);
    });

    it('registers a handler for every Core Web Vital on start()', async () => {
      await flushStart(() => service.start());
      expect(registered.onCLS).toBeTypeOf('function');
      expect(registered.onINP).toBeTypeOf('function');
      expect(registered.onLCP).toBeTypeOf('function');
      expect(registered.onFCP).toBeTypeOf('function');
      expect(registered.onTTFB).toBeTypeOf('function');
    });

    it('is idempotent — a second start() does not re-register handlers', async () => {
      await flushStart(() => service.start());
      const firstCls = registered.onCLS;
      resetRegistered();

      await flushStart(() => service.start());
      expect(registered.onCLS).toBeUndefined();
      expect(firstCls).toBeTypeOf('function');
    });

    it('logs metrics to the console in development', async () => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      await flushStart(() => service.start());

      registered.onLCP?.({ name: 'LCP', value: 1234.56, id: 'v3-1', rating: 'good' });

      expect(info).toHaveBeenCalledWith(expect.stringContaining('LCP=1234.56'));
      expect(info).toHaveBeenCalledWith(expect.stringContaining('good'));
    });

    it('skips beaconing when endpoint is empty (default)', async () => {
      const beacon = vi.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
      vi.spyOn(console, 'info').mockImplementation(() => undefined);

      await flushStart(() => service.start());
      registered.onCLS?.({ name: 'CLS', value: 0.01, id: 'v3-2' });

      expect(beacon).not.toHaveBeenCalled();
    });

    it('beacons to the configured endpoint with the metric payload', async () => {
      const beacon = vi.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
      vi.spyOn(console, 'info').mockImplementation(() => undefined);

      await flushStart(() => service.start({ endpoint: '/beacon' }));
      registered.onINP?.({ name: 'INP', value: 42, id: 'v3-3', rating: 'good' });

      expect(beacon).toHaveBeenCalledTimes(1);
      const [url, body] = beacon.mock.calls[0];
      expect(url).toBe('/beacon');
      const payload = JSON.parse(body as string);
      expect(payload).toMatchObject({ name: 'INP', value: 42, id: 'v3-3', rating: 'good' });
      expect(typeof payload.ts).toBe('number');
      expect(typeof payload.path).toBe('string');
    });

    it('swallows sendBeacon exceptions (best-effort)', async () => {
      const beacon = vi.fn(() => {
        throw new Error('boom');
      });
      Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
      vi.spyOn(console, 'info').mockImplementation(() => undefined);

      await flushStart(() => service.start({ endpoint: '/beacon' }));

      expect(() => registered.onCLS?.({ name: 'CLS', value: 0.02, id: 'v3-4' })).not.toThrow();
    });
  });

  describe('server platform', () => {
    it('start() is a no-op on non-browser platforms', async () => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      const service = TestBed.inject(WebVitalsService);

      await flushStart(() => service.start());

      expect(registered.onCLS).toBeUndefined();
      expect(registered.onLCP).toBeUndefined();
    });
  });
});
