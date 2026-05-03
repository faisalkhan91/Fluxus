import { test as base, expect, type Page } from '@playwright/test';

/**
 * Accepts both the new registry ids (`crimson-dark`, `tokyo-night`, …) and
 * the legacy `'dark'` / `'light'` values that ThemeService migrates on
 * read. Specs that exercise the migration path use the legacy values
 * directly; everything else seeds a registry id.
 */
export type Theme =
  | 'crimson-dark'
  | 'crimson-light'
  | 'one-dark'
  | 'tokyo-night'
  | 'catppuccin-mocha'
  | 'solarized-light'
  | 'dark'
  | 'light';

/**
 * Seed `localStorage.theme` *before* the page navigates so the inline
 * pre-paint <script> in index.html applies the correct `data-theme`
 * attribute synchronously, with no FOUC.
 *
 * Must be called before `page.goto()`.
 */
export async function seedTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((value) => {
    try {
      window.localStorage.setItem('theme', value);
    } catch {
      // localStorage may be unavailable on file:// — ignore.
    }
  }, theme);
}

/**
 * Emulate `prefers-reduced-motion: reduce` for the current page.
 * Affects both CSS media queries and the View Transitions feature flag.
 */
export async function enableReducedMotion(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

/**
 * Hook `document.startViewTransition` so we can assert the View Transitions
 * API was actually invoked by the Angular router on a route change.
 *
 * The boolean is exposed at `window.__vtCalled` and reset by this helper.
 */
export async function trackViewTransitions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    interface VTWindow {
      __vtCalled?: boolean;
    }
    const w = window as Window & VTWindow;
    w.__vtCalled = false;

    /*
      Cast through `unknown` to escape the lib.dom intersection on
      `Document.startViewTransition` (which is overloaded to return
      `ViewTransition`). We don't need that strictness here -- we just
      need a hookable function slot, so a fresh structural type does
      the job without TS complaining about the return-type mismatch.
    */
    type StartViewTransition = (cb: () => void) => unknown;
    const docVT = document as unknown as {
      startViewTransition?: StartViewTransition;
    };
    const original = docVT.startViewTransition;

    if (typeof original === 'function') {
      docVT.startViewTransition = function (this: Document, cb: () => void) {
        w.__vtCalled = true;
        return original.call(this, cb);
      };
    }
  });
}

export async function readViewTransitionFlag(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as Window & { __vtCalled?: boolean }).__vtCalled === true);
}

/**
 * Mobile viewport matching the `mobile-chromium` Playwright project (Pixel 7).
 * Useful for specs that want to force mobile in any project.
 */
export const MOBILE_VIEWPORT = { width: 412, height: 915 };

/**
 * The 8 SSG'd top-level routes plus one prerendered blog post.
 * Order matches the prerender audit script.
 */
export const PRERENDERED_ROUTES = [
  '/',
  '/about',
  '/experience',
  '/skills',
  '/projects',
  '/certifications',
  '/contact',
  '/blog',
  '/blog/angular-signals-state-management',
] as const;

export const test = base;
export { expect };
