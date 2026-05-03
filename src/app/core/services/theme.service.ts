import {
  Injectable,
  signal,
  computed,
  effect,
  DestroyRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DEFAULT_DARK_ID,
  DEFAULT_LIGHT_ID,
  THEME_REGISTRY,
  type ThemeDef,
  type ThemeId,
  getThemeDef,
  isThemeId,
} from './theme.registry';

const STORAGE_KEY = 'theme';
/**
 * Tracks the user's last-picked id within each scheme so `toggle()` flips
 * back to whatever flavour of dark / light the user actually chose. Without
 * this, toggling out of (say) Tokyo Night would always land on Crimson Light
 * and lose the user's customisation.
 */
const LAST_BY_SCHEME_KEY = 'theme:last-by-scheme';
/**
 * Pre-existing localStorage values from before the multi-theme refactor.
 * We migrate `'dark'` / `'light'` to their `crimson-*` equivalents on read
 * so returning visitors don't drop back to the system default.
 */
const LEGACY_TO_ID: Record<string, ThemeId> = {
  dark: DEFAULT_DARK_ID,
  light: DEFAULT_LIGHT_ID,
};

interface LastByScheme {
  dark: ThemeId;
  light: ThemeId;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /*
    `window.matchMedia` is missing in vitest's jsdom environment by
    default — guard before calling so the service doesn't crash during
    unit-test bootstrap. The runtime gate is correctness, not a hack:
    a fallback environment without `matchMedia` (very old WebViews,
    contrived test setups) should still construct the service cleanly
    with `mediaQuery` left as null. The downstream consumers already
    null-check via `this.mediaQuery?.…`.
  */
  private mediaQuery =
    this.isBrowser && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: light)')
      : null;

  /** All themes available to the picker, in display order. */
  readonly registry: readonly ThemeDef[] = THEME_REGISTRY;

  readonly theme = signal<ThemeId>(this.resolveInitial());
  readonly themeDef = computed<ThemeDef>(() => getThemeDef(this.theme()));
  readonly scheme = computed<'dark' | 'light'>(() => this.themeDef().scheme);
  /**
   * Kept for backwards compatibility with existing template bindings
   * (sidebar, shell, specs). New call sites should prefer `scheme()` or
   * `themeDef()` for richer information.
   */
  readonly isDark = computed(() => this.scheme() === 'dark');

  constructor() {
    // The inline pre-paint script in index.html sets `data-theme` and the
    // matching <meta name="theme-color"> before first paint to avoid FOUC.
    // This effect only mirrors runtime swaps into the DOM.
    if (this.isBrowser) {
      effect(() => {
        const def = this.themeDef();
        this.document.documentElement.setAttribute('data-theme', def.id);
        this.syncMetaThemeColor(def);
      });

      if (this.mediaQuery && !localStorage.getItem(STORAGE_KEY)) {
        const onChange = (e: MediaQueryListEvent) => {
          if (!localStorage.getItem(STORAGE_KEY)) {
            this.theme.set(e.matches ? DEFAULT_LIGHT_ID : DEFAULT_DARK_ID);
          }
        };
        this.mediaQuery.addEventListener('change', onChange);
        this.destroyRef.onDestroy(() => this.mediaQuery?.removeEventListener('change', onChange));
      }
    }
  }

  /**
   * Apply a specific theme by id. Persists the choice and updates the
   * last-by-scheme bookkeeping that powers `toggle()`. Wraps the swap in
   * the View Transitions API when available so the entire viewport
   * cross-fades instead of snapping (suppressed for reduced-motion users
   * and on browsers without the API — Firefox at the time of writing).
   */
  setTheme(id: ThemeId): void {
    if (!isThemeId(id)) return;

    const supportsViewTransition =
      this.isBrowser &&
      'startViewTransition' in this.document &&
      typeof (this.document as Document & { startViewTransition?: unknown }).startViewTransition ===
        'function';
    const prefersReducedMotion =
      this.isBrowser &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (supportsViewTransition && !prefersReducedMotion) {
      (
        this.document as Document & { startViewTransition: (cb: () => void) => unknown }
      ).startViewTransition(() => this.theme.set(id));
    } else {
      this.theme.set(id);
    }

    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, id);
      this.rememberByScheme(id);
    }
  }

  /**
   * Bounce between the user's most recent dark and light pick.
   *
   * Without per-scheme memory the FAB / sidebar toggle would treat themes
   * like a binary choice and force every dark-mode user back to Crimson
   * Light when they tapped the moon — losing whatever flavour they had
   * picked. This pulls the remembered id from `LAST_BY_SCHEME_KEY` (or
   * defaults to the canonical Crimson pair) so toggling out of Tokyo
   * Night and back lands on Tokyo Night again.
   */
  toggle(): void {
    const memory = this.readLastByScheme();
    const nextScheme: 'dark' | 'light' = this.isDark() ? 'light' : 'dark';
    this.setTheme(memory[nextScheme]);
  }

  private resolveInitial(): ThemeId {
    if (!this.isBrowser) return DEFAULT_DARK_ID;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      if (isThemeId(stored)) return stored;
      const migrated = LEGACY_TO_ID[stored];
      if (migrated) {
        // Rewrite the legacy value so subsequent loads (and the inline
        // pre-paint script's allowlist) take the fast path.
        localStorage.setItem(STORAGE_KEY, migrated);
        return migrated;
      }
    }
    return this.mediaQuery?.matches ? DEFAULT_LIGHT_ID : DEFAULT_DARK_ID;
  }

  /**
   * Update both `<meta name="theme-color">` tags so iOS / Android system
   * chrome follows the swap. The two tags are media-gated on
   * `prefers-color-scheme` so we only need to overwrite the one matching
   * the active theme's coarse scheme — the other stays as the user's
   * system fallback in case they swap themes back to "match system".
   */
  private syncMetaThemeColor(def: ThemeDef): void {
    const selector = `meta[name="theme-color"][media*="${def.scheme}"]`;
    const tag = this.document.querySelector<HTMLMetaElement>(selector);
    if (tag) tag.setAttribute('content', def.themeColor);
  }

  private readLastByScheme(): LastByScheme {
    const fallback: LastByScheme = { dark: DEFAULT_DARK_ID, light: DEFAULT_LIGHT_ID };
    if (!this.isBrowser) return fallback;
    try {
      const raw = localStorage.getItem(LAST_BY_SCHEME_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<LastByScheme>;
      return {
        dark: isThemeId(parsed.dark) ? parsed.dark : DEFAULT_DARK_ID,
        light: isThemeId(parsed.light) ? parsed.light : DEFAULT_LIGHT_ID,
      };
    } catch {
      return fallback;
    }
  }

  private rememberByScheme(id: ThemeId): void {
    if (!this.isBrowser) return;
    const def = getThemeDef(id);
    const current = this.readLastByScheme();
    const next: LastByScheme = { ...current, [def.scheme]: id };
    try {
      localStorage.setItem(LAST_BY_SCHEME_KEY, JSON.stringify(next));
    } catch {
      // localStorage can throw in private mode / quota-exceeded; the
      // visible signal swap has already happened, so swallow.
    }
  }
}

export type { ThemeId, ThemeDef };
