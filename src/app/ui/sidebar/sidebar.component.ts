import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { IconComponent } from '../icon/icon.component';
import { ProfileDataService } from '@core/services/profile-data.service';
import type { ThemeDef } from '@core/services/theme.registry';

export type SidebarItem =
  | { type: 'link'; label: string; ext: string; route: string; icon: string }
  | { type: 'divider'; label: string };

@Component({
  selector: 'ui-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage, IconComponent],
  host: {
    '[class.collapsed]': 'collapsed()',
    '[style.--nav-indicator-y.px]': 'indicatorY()',
    '[style.--nav-indicator-height.px]': 'indicatorHeight()',
    role: 'navigation',
    'aria-label': 'Main Navigation',
  },
})
export class SidebarComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  /** Identity (name/role/avatar) shown in the sidebar header. */
  protected readonly profile = inject(ProfileDataService);

  readonly items = input.required<SidebarItem[]>();
  readonly collapsed = input(false);
  /**
   * Currently-active theme definition. Drives the icon (sun on dark themes
   * = "next is light", moon on light themes = "next is dark") and the
   * inline label. Required so the sidebar never has to guess; the shell
   * always has a definite ThemeService reading available.
   */
  readonly currentTheme = input.required<ThemeDef>();
  resumeClicked = output<void>();
  /** Quick swap to the user's last pick within the opposite scheme. */
  themeToggled = output<void>();
  /**
   * Open the command palette pre-filtered to theme entries so the user can
   * pick any theme by name (not just bounce between dark/light).
   */
  themePickerRequested = output<void>();

  /** Computed shorthand for the template; keeps the binding boilerplate down. */
  protected readonly isDark = computed<boolean>(() => this.currentTheme().scheme === 'dark');

  /**
   * Click handler that lets a single visible button cover both default
   * (toggle) and discoverable (open picker) intents — Shift+click /
   * Alt+click bypass the binary swap and surface the full picker so power
   * users don't have to chase a separate affordance. Mouse + keyboard
   * activation both flow through here because Angular fires `click` for
   * Enter / Space on `<button>` automatically.
   */
  protected onThemeButtonClick(event: MouseEvent | KeyboardEvent): void {
    if (event.shiftKey || event.altKey) {
      this.themePickerRequested.emit();
    } else {
      this.themeToggled.emit();
    }
  }

  /*
    H4 — single sliding indicator (mirrors the editor tab bar).
    A vertical bar pinned to the left of `.nav-list` translates between
    nav items as the route changes. We listen to `NavigationEnd` and
    re-query the active `.nav-item` because RouterLinkActive applies the
    class asynchronously after navigation; reading offsetTop / offsetHeight
    inside a microtask ensures the layout is committed before we read.
  */
  protected readonly indicatorY = signal(0);
  protected readonly indicatorHeight = signal(0);

  constructor() {
    // `afterNextRender` (browser-only, never runs during SSR) wires the
    // route-change subscription and runs the initial measurement once the
    // first render commits — matching EditorTabBarComponent and keeping all
    // reactive setup in the constructor rather than a lifecycle hook.
    afterNextRender(() => {
      this.router.events
        .pipe(
          filter((evt) => evt instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => queueMicrotask(() => this.updateIndicator()));
      queueMicrotask(() => this.updateIndicator());
    });
  }

  private updateIndicator(): void {
    const active = this.host.nativeElement.querySelector<HTMLElement>('.nav-item.active');
    if (!active) {
      this.indicatorHeight.set(0);
      return;
    }
    this.indicatorY.set(active.offsetTop);
    this.indicatorHeight.set(active.offsetHeight);
  }
}
