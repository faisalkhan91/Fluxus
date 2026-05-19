import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prefersReducedMotion } from './motion.utils';

describe('prefersReducedMotion', () => {
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    // jsdom doesn't ship matchMedia, so the global isn't there to be
    // spied on. Install a stub before each test, capture whatever was
    // there originally (usually undefined), then restore in afterEach.
    originalMatchMedia = window.matchMedia;
    Reflect.set(window, 'matchMedia', () => ({ matches: false }) as MediaQueryList);
  });

  afterEach(() => {
    Reflect.set(window, 'matchMedia', originalMatchMedia);
  });

  it('returns true when the OS reports the user prefers reduced motion', () => {
    const spy = vi
      .spyOn(window, 'matchMedia')
      .mockReturnValue({ matches: true } as MediaQueryList);
    try {
      expect(prefersReducedMotion()).toBe(true);
      expect(spy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    } finally {
      spy.mockRestore();
    }
  });

  it('returns false when the OS reports no motion preference', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns false when matchMedia is not a function (older webview / odd env)', () => {
    Reflect.set(window, 'matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});
