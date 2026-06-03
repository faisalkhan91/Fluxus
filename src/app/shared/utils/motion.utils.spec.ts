import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prefersReducedMotion, applyViewTransition } from './motion.utils';

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
    const spy = vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
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

describe('applyViewTransition', () => {
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    // Default to "no reduced-motion preference" so the transition path is
    // reachable; individual tests override as needed.
    originalMatchMedia = window.matchMedia;
    Reflect.set(window, 'matchMedia', () => ({ matches: false }) as MediaQueryList);
  });

  afterEach(() => {
    Reflect.set(window, 'matchMedia', originalMatchMedia);
  });

  it('runs the mutation inside startViewTransition when supported and motion is allowed', () => {
    const mutate = vi.fn();
    const startViewTransition = vi.fn((cb: () => void) => cb());
    const doc = { startViewTransition } as unknown as Document;

    applyViewTransition(doc, mutate);

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    // The wrapped callback is the mutation, so invoking it applied the change.
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('applies the mutation instantly (no transition) when the API is absent', () => {
    const mutate = vi.fn();
    const doc = {} as Document; // no startViewTransition

    applyViewTransition(doc, mutate);

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('bypasses startViewTransition when the user prefers reduced motion', () => {
    Reflect.set(window, 'matchMedia', () => ({ matches: true }) as MediaQueryList);
    const mutate = vi.fn();
    const startViewTransition = vi.fn((cb: () => void) => cb());
    const doc = { startViewTransition } as unknown as Document;

    applyViewTransition(doc, mutate);

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(mutate).toHaveBeenCalledTimes(1);
  });
});
