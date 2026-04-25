import { Injectable, signal, computed, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type BreakpointKey = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Boundary queries that match the breakpoints used in CSS. Listening to
 * matchMedia is cheaper than a resize handler (no per-frame work) and
 * conveys the intent more clearly.
 */
const MOBILE_MAX = '(max-width: 767px)';
const TABLET_MAX = '(max-width: 1023px)';
const DESKTOP_MAX = '(max-width: 1279px)';

/** SSR default: assume wide/desktop layout for prerendered HTML. */
const SSR_DEFAULT: BreakpointKey = 'wide';

function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function resolveBreakpoint(): BreakpointKey {
  if (!hasMatchMedia()) return SSR_DEFAULT;
  if (window.matchMedia(MOBILE_MAX).matches) return 'mobile';
  if (window.matchMedia(TABLET_MAX).matches) return 'tablet';
  if (window.matchMedia(DESKTOP_MAX).matches) return 'desktop';
  return 'wide';
}

@Injectable({ providedIn: 'root' })
export class MediaQueryService {
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private current = signal<BreakpointKey>(this.isBrowser ? resolveBreakpoint() : SSR_DEFAULT);

  readonly breakpoint = computed<BreakpointKey>(() => this.current());

  readonly isMobile = computed(() => this.breakpoint() === 'mobile');
  readonly isTablet = computed(() => this.breakpoint() === 'tablet');
  readonly isDesktop = computed(
    () => this.breakpoint() === 'desktop' || this.breakpoint() === 'wide',
  );
  readonly showSidebar = computed(() => !this.isMobile());
  readonly sidebarCollapsed = computed(() => this.breakpoint() === 'tablet');
  readonly showMobileNav = computed(() => this.isMobile());

  constructor() {
    if (!this.isBrowser || !hasMatchMedia()) return;

    const update = () => this.current.set(resolveBreakpoint());
    const queries = [MOBILE_MAX, TABLET_MAX, DESKTOP_MAX].map((q) => window.matchMedia(q));

    for (const mql of queries) {
      mql.addEventListener('change', update);
    }
    this.destroyRef.onDestroy(() => {
      for (const mql of queries) {
        mql.removeEventListener('change', update);
      }
    });
  }
}
