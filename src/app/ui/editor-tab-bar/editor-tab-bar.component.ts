import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface EditorTab {
  id: string;
  label: string;
  ext: string;
  color: string;
  route: string;
}

@Component({
  selector: 'ui-editor-tab-bar',
  templateUrl: './editor-tab-bar.component.html',
  styleUrl: './editor-tab-bar.component.css',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorTabBarComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  tabs = input.required<EditorTab[]>();
  activeTabId = input.required<string>();
  tabSelected = output<EditorTab>();
  tabClosed = output<EditorTab>();
  closeAllRequested = output<void>();

  protected scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  protected showLeftFade = signal(false);
  protected showRightFade = signal(false);
  protected closableCount = computed(() => this.tabs().filter((t) => t.id !== 'hero').length);

  /*
    H4 — single sliding indicator.

    Instead of painting an underline onto each `.tab.active`, a single bar
    lives at the bottom of `.tabs-scroll` and animates between positions via
    CSS custom properties on the host. `--tab-indicator-x` and
    `--tab-indicator-width` are recomputed whenever the active tab or the
    rendered tab geometry changes; the CSS handles the easing.
  */
  protected indicatorX = signal(0);
  protected indicatorWidth = signal(0);
  /*
    Suppresses the indicator's `transition` until the first geometry
    pass has committed. Without this, the SSR pre-hydration HTML
    paints the bar at `width: 0` (the CSS-var default below), then
    JS computes the active tab's `offsetLeft` / `offsetWidth` and
    sets the vars — and the CSS transition animates from 0 →
    computed-position in the first paint cycle. Visible teleport
    on every cold tab-bar mount, especially noticeable on slow
    devices where the gap between SSR paint and JS hydration is
    long enough to see.

    Flipped to `true` once `updateIndicator` has run via
    `afterNextRender`, which is when the geometry first becomes
    real. The CSS rule that consumes this class re-enables the
    transition only after that point — so the very first render
    is in-place, every subsequent move animates.
  */
  protected indicatorReady = signal(false);

  constructor() {
    /*
      Single ownership point for fade + indicator recomputation. Both
      effects react to tab/active-id changes and run via `queueMicrotask`
      so the DOM layout has settled before we read `scrollLeft` /
      `offsetLeft`. The reads themselves bail when `scrollContainer()`
      is undefined (server-side, or before the first render), which is
      why we no longer need a separate `ngAfterViewInit` to bootstrap
      the initial computation — `afterNextRender` (below) attaches the
      scroll/resize listeners *and* triggers a final pass once the
      view is committed; the constructor effects then own every
      subsequent recomputation.
    */
    effect(() => {
      this.tabs();
      if (this.isBrowser) {
        queueMicrotask(() => this.updateFades());
      }
    });

    effect(() => {
      this.tabs();
      this.activeTabId();
      if (this.isBrowser) {
        queueMicrotask(() => this.updateIndicator());
      }
    });

    afterNextRender(() => {
      const el = this.scrollContainer()?.nativeElement;
      if (!el) return;

      const onScrollOrResize = () => {
        this.updateFades();
        this.updateIndicator();
      };
      el.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', onScrollOrResize, { passive: true });
      this.destroyRef.onDestroy(() => {
        el.removeEventListener('scroll', onScrollOrResize);
        window.removeEventListener('resize', onScrollOrResize);
      });

      // Initial pass once the view has been committed and the scroll
      // container's geometry is real. Subsequent runs come from the
      // constructor effects above.
      this.updateFades();
      this.updateIndicator();

      // Flip `indicatorReady` after the first geometry computation
      // has painted, so the next paint frame re-enables the
      // transition. Subsequent indicator moves animate; the very
      // first one (the SSR-→-real-geometry hop) is in-place.
      // requestAnimationFrame ensures the previous frame's
      // `width: 0` paint commits before the transition turns on,
      // otherwise the class flip would race the computed values
      // and we'd get the same teleport we're trying to suppress.
      if (this.isBrowser) {
        requestAnimationFrame(() => this.indicatorReady.set(true));
      }
    });
  }

  private updateIndicator(): void {
    const scroller = this.scrollContainer()?.nativeElement;
    if (!scroller) return;
    const active = scroller.querySelector<HTMLElement>('.tab.active');
    if (!active) {
      this.indicatorWidth.set(0);
      return;
    }
    this.indicatorX.set(active.offsetLeft);
    this.indicatorWidth.set(active.offsetWidth);
  }

  private updateFades(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    this.showLeftFade.set(scrollLeft > 4);
    this.showRightFade.set(scrollLeft + clientWidth < scrollWidth - 4);
  }

  protected onArrow(event: Event, currentIndex: number, direction: -1 | 1): void {
    event.preventDefault();
    const tabs = this.tabs();
    if (tabs.length === 0) return;

    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    this.tabSelected.emit(next);

    const buttons = this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.tab');
    buttons[nextIndex]?.focus();
  }
}
