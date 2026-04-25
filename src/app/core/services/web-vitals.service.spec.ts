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

const registered: Partial<Record<'onCLS' | 'onINP' | 'onLCP' | 'onFCP' | 'onTTFB', Handler>> =
  {};

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

describe('WebVitalsService', () => {
  beforeEach(() => {
    resetRegistered();
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
      await service.start();
      expect(registered.onCLS).toBeTypeOf('function');
      expect(registered.onINP).toBeTypeOf('function');
      expect(registered.onLCP).toBeTypeOf('function');
      expect(registered.onFCP).toBeTypeOf('function');
      expect(registered.onTTFB).toBeTypeOf('function');
    });

    it('is idempotent — a second start() does not re-register handlers', async () => {
      await service.start();
      const firstCls = registered.onCLS;
      resetRegistered();

      await service.start();
      expect(registered.onCLS).toBeUndefined();
      expect(firstCls).toBeTypeOf('function');
    });

    it('logs metrics to the console in development', async () => {
      const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      await service.start();

      registered.onLCP?.({ name: 'LCP', value: 1234.56, id: 'v3-1', rating: 'good' });

      expect(info).toHaveBeenCalledWith(expect.stringContaining('LCP=1234.56'));
      expect(info).toHaveBeenCalledWith(expect.stringContaining('good'));
    });

    it('skips beaconing when endpoint is empty (default)', async () => {
      const beacon = vi.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
      vi.spyOn(console, 'info').mockImplementation(() => undefined);

      await service.start();
      registered.onCLS?.({ name: 'CLS', value: 0.01, id: 'v3-2' });

      expect(beacon).not.toHaveBeenCalled();
    });

    it('beacons to the configured endpoint with the metric payload', async () => {
      const beacon = vi.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
      vi.spyOn(console, 'info').mockImplementation(() => undefined);

      await service.start({ endpoint: '/beacon' });
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

      await service.start({ endpoint: '/beacon' });

      expect(() =>
        registered.onCLS?.({ name: 'CLS', value: 0.02, id: 'v3-4' }),
      ).not.toThrow();
    });
  });

  describe('server platform', () => {
    it('start() is a no-op on non-browser platforms', async () => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      const service = TestBed.inject(WebVitalsService);

      await service.start();

      expect(registered.onCLS).toBeUndefined();
      expect(registered.onLCP).toBeUndefined();
    });
  });
});
