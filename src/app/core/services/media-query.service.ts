import { Injectable, signal, computed, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type BreakpointKey = 'mobile' | 'tablet' | 'desktop' | 'wide';

/** SSR default: assume wide/desktop layout for prerendered HTML. */
const SSR_DEFAULT_WIDTH = 1280;

@Injectable({ providedIn: 'root' })
export class MediaQueryService {
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private width = signal(this.isBrowser ? window.innerWidth : SSR_DEFAULT_WIDTH);

  readonly breakpoint = computed<BreakpointKey>(() => {
    const w = this.width();
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    if (w < 1280) return 'desktop';
    return 'wide';
  });

  readonly isMobile = computed(() => this.breakpoint() === 'mobile');
  readonly isTablet = computed(() => this.breakpoint() === 'tablet');
  readonly isDesktop = computed(
    () => this.breakpoint() === 'desktop' || this.breakpoint() === 'wide',
  );
  readonly showSidebar = computed(() => !this.isMobile());
  readonly sidebarCollapsed = computed(() => this.breakpoint() === 'tablet');
  readonly showMobileNav = computed(() => this.isMobile());

  constructor() {
    if (!this.isBrowser) return;
    const onResize = () => this.width.set(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
  }
}
