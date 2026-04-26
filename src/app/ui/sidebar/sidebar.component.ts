import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { IconComponent } from '../icon/icon.component';

export type SidebarItem =
  | { type: 'link'; label: string; ext: string; route: string; icon: string }
  | { type: 'divider'; label: string };

@Component({
  selector: 'ui-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.collapsed]': 'collapsed()',
    '[style.--nav-indicator-y.px]': 'indicatorY()',
    '[style.--nav-indicator-height.px]': 'indicatorHeight()',
    role: 'navigation',
    'aria-label': 'Main Navigation',
  },
})
export class SidebarComponent implements AfterViewInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  items = input<SidebarItem[]>([]);
  collapsed = input(false);
  isDark = input(true);
  resumeClicked = output<void>();
  themeToggled = output<void>();

  /*
    H4 — single sliding indicator (mirrors the editor tab bar).
    A vertical bar pinned to the left of `.nav-list` translates between
    nav items as the route changes. We listen to `NavigationEnd` and
    re-query the active `.nav-item` because RouterLinkActive applies the
    class asynchronously after navigation; reading offsetTop / offsetHeight
    inside a microtask ensures the layout is committed before we read.
  */
  protected indicatorY = signal(0);
  protected indicatorHeight = signal(0);

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const sub = this.router.events
      .pipe(filter((evt) => evt instanceof NavigationEnd))
      .subscribe(() => queueMicrotask(() => this.updateIndicator()));
    this.destroyRef.onDestroy(() => sub.unsubscribe());
    queueMicrotask(() => this.updateIndicator());
  }

  protected updateIndicator(): void {
    const active = this.host.nativeElement.querySelector<HTMLElement>('.nav-item.active');
    if (!active) {
      this.indicatorHeight.set(0);
      return;
    }
    this.indicatorY.set(active.offsetTop);
    this.indicatorHeight.set(active.offsetHeight);
  }
}
