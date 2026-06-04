import {
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
import { rovingNext, focusByIndex } from '@shared/utils/roving.utils';

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
})
export class EditorTabBarComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly tabs = input.required<EditorTab[]>();
  readonly activeTabId = input.required<string>();
  tabSelected = output<EditorTab>();
  tabClosed = output<EditorTab>();
  closeAllRequested = output<void>();

  protected readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  protected readonly showLeftFade = signal(false);
  protected readonly showRightFade = signal(false);
  protected readonly closableCount = computed(
    () => this.tabs().filter((t) => t.id !== 'hero').length,
  );

  /*
    H4 — single sliding indicator.

    Instead of painting an underline onto each `.tab.active`, a single bar
    lives at the bottom of `.tabs-scroll` and animates between positions via
    CSS custom properties on the host. `--tab-indicator-x` and
    `--tab-indicator-width` are recomputed whenever the active tab or the
    rendered tab geometry changes; the CSS handles the easing.
  */
  protected readonly indicatorX = signal(0);
  protected readonly indicatorWidth = signal(0);
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
  protected readonly indicatorReady = signal(false);

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

    const nextIndex = rovingNext(currentIndex, direction, tabs.length);
    this.tabSelected.emit(tabs[nextIndex]);
    focusByIndex(this.host.nativeElement, '.tab', nextIndex);
  }

  /*
    Why no Cmd/Ctrl+W close shortcut: every major browser reserves
    Cmd+W (mac) and Ctrl+W (Windows / Linux) at the chrome layer for
    "close browser tab" before the keystroke is dispatched to the page.
    A document-level keydown listener never sees the event, and
    preventDefault() on a synthetic dispatch has no effect on the
    real OS handler. The Delete key (above) is the in-app analogue
    for keyboard close on a focused tab — there's no portable way to
    bind to the browser's reserved combo. Don't waste time retrying.
  */

  /**
   * Middle-click closes a tab. Universal editor convention (VS Code,
   * Sublime, Chrome tabs, Firefox tabs, IntelliJ) and a long-standing
   * gap in this UI — users who muscle-memory'd the gesture from any of
   * those found their tabs "stuck". Welcome is pinned, so the close
   * silently no-ops on `hero` to match the close-button branch.
   *
   * `event.button === 1` is the middle button across spec'd UAs;
   * touchpad three-finger tap also surfaces as a middle-click on
   * macOS / Windows precision pointers, so the same handler covers
   * trackpad gestures users associate with "kill the thing under
   * the pointer".
   */
  protected onAuxClick(event: MouseEvent, tab: EditorTab): void {
    if (event.button !== 1) return;
    if (tab.id === 'hero') return;
    event.preventDefault();
    this.tabClosed.emit(tab);
  }
}
