import { Injectable, signal, computed, DestroyRef, inject } from '@angular/core';

export type BreakpointKey = 'mobile' | 'tablet' | 'desktop' | 'wide';

@Injectable({ providedIn: 'root' })
export class MediaQueryService {
  private destroyRef = inject(DestroyRef);
  private width = signal(typeof window !== 'undefined' ? window.innerWidth : 1280);

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
    if (typeof window === 'undefined') return;
    const onResize = () => this.width.set(window.innerWidth);
    window.addEventListener('resize', onResize, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
  }
}
