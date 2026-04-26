import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
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
export class EditorTabBarComponent implements AfterViewInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  tabs = input<EditorTab[]>([]);
  activeTabId = input<string>('');
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

  constructor() {
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
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;

    const onScroll = () => {
      this.updateFades();
      this.updateIndicator();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => el.removeEventListener('scroll', onScroll));

    const onResize = () => {
      this.updateFades();
      this.updateIndicator();
    };
    window.addEventListener('resize', onResize, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));

    this.updateFades();
    this.updateIndicator();
  }

  protected updateIndicator(): void {
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

  protected updateFades(): void {
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
