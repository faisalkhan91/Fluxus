import { Injectable, signal, computed, effect, DestroyRef, inject } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private destroyRef = inject(DestroyRef);
  private mediaQuery = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: light)')
    : null;

  readonly theme = signal<Theme>(this.resolveInitial());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const t = this.theme();
      if (typeof document !== 'undefined') {
        if (t === 'dark') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', t);
        }
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

  toggle(): void {
    const next: Theme = this.isDark() ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  private resolveInitial(): Theme {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return this.mediaQuery?.matches ? 'light' : 'dark';
  }
}
