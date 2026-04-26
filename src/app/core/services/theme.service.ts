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

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private mediaQuery = this.isBrowser ? window.matchMedia('(prefers-color-scheme: light)') : null;

  readonly theme = signal<Theme>(this.resolveInitial());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    // The inline pre-paint script in index.html sets `data-theme` before first paint
    // to avoid FOUC. This effect only mirrors runtime toggles into the DOM.
    if (this.isBrowser) {
      effect(() => {
        const t = this.theme();
        if (t === 'dark') {
          this.document.documentElement.removeAttribute('data-theme');
        } else {
          this.document.documentElement.setAttribute('data-theme', t);
        }
      });

      if (this.mediaQuery && !localStorage.getItem(STORAGE_KEY)) {
        const onChange = (e: MediaQueryListEvent) => {
          if (!localStorage.getItem(STORAGE_KEY)) {
            this.theme.set(e.matches ? 'light' : 'dark');
          }
        };
        this.mediaQuery.addEventListener('change', onChange);
        this.destroyRef.onDestroy(() => this.mediaQuery?.removeEventListener('change', onChange));
      }
    }
  }

  toggle(): void {
    const next: Theme = this.isDark() ? 'light' : 'dark';
    /*
      Use the View Transitions API when available so the colour-token swap
      cross-fades the entire viewport instead of snapping. We bypass it for
      users who opted into reduced motion (cross-fading the whole page is
      exactly the kind of large-area motion that flag is meant to suppress)
      and on browsers that don't ship the API yet (Firefox at time of
      writing). The fallback path is the original signal write.
    */
    const supportsViewTransition =
      this.isBrowser &&
      'startViewTransition' in this.document &&
      typeof (this.document as Document & { startViewTransition?: unknown }).startViewTransition ===
        'function';
    const prefersReducedMotion =
      this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (supportsViewTransition && !prefersReducedMotion) {
      (
        this.document as Document & { startViewTransition: (cb: () => void) => unknown }
      ).startViewTransition(() => this.theme.set(next));
    } else {
      this.theme.set(next);
    }

    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }

  private resolveInitial(): Theme {
    if (!this.isBrowser) return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return this.mediaQuery?.matches ? 'light' : 'dark';
  }
}
