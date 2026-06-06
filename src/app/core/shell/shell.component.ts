import { Component, inject, viewChild, PLATFORM_ID, DestroyRef } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '@ui/sidebar/sidebar.component';
import { EditorTabBarComponent } from '@ui/editor-tab-bar/editor-tab-bar.component';
import { MobileNavPillComponent } from '@ui/mobile-nav-pill/mobile-nav-pill.component';
import { IconComponent } from '@ui/icon/icon.component';
import { ToastRegionComponent } from '@ui/toast-region/toast-region.component';
import { CommandPaletteComponent } from '@ui/command-palette/command-palette.component';
import { TerminalComponent } from '@ui/terminal/terminal.component';
import { ShortcutsHelpComponent } from '@ui/shortcuts-help/shortcuts-help.component';
import { MediaQueryService } from '../services/media-query.service';
import { TabService } from '../services/tab.service';
import { NavigationService } from '../services/navigation.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  imports: [
    RouterOutlet,
    SidebarComponent,
    EditorTabBarComponent,
    MobileNavPillComponent,
    IconComponent,
    ToastRegionComponent,
    CommandPaletteComponent,
    TerminalComponent,
    ShortcutsHelpComponent,
  ],
})
export class ShellComponent {
  protected media = inject(MediaQueryService);
  protected tabService = inject(TabService);
  protected navService = inject(NavigationService);
  protected themeService = inject(ThemeService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    if (!this.isBrowser) return;
    // Move focus to the `<main id="main-content" tabindex="-1">` landmark
    // on every route change *after* the initial load. Without this, screen
    // readers stay focused on whatever element the user just clicked
    // (often a sidebar link), so they hear no announcement that a new
    // page has rendered. The cold-load case is excluded — the browser
    // already places focus appropriately (top of doc / :target) and
    // forcing focus here would scroll-jump the page on first paint.
    //
    // Pure-fragment changes (#section anchors) are handled by Angular's
    // `anchorScrolling: 'enabled'` in app.config.ts and don't need a
    // focus refocus — comparing the path-only portion of the URL keeps
    // the old fragment-click → focus-stays-near-anchor behaviour intact.
    let isInitial = true;
    let lastPath = '';
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        if (isInitial) {
          isInitial = false;
          lastPath = path;
          return;
        }
        if (path === lastPath) return;
        lastPath = path;
        // Defer to a microtask so the new route's component has had a
        // chance to project into `<router-outlet>` before we move focus.
        queueMicrotask(() => {
          const main = this.document.getElementById('main-content');
          main?.focus({ preventScroll: true });
        });
      });
  }

  /**
   * Reference to the command palette so the sidebar / FAB can pre-fill
   * the input with `theme:` and surface every theme entry in one tap.
   * Using `viewChild` keeps the wiring local to the shell instead of
   * routing through a service for what is essentially a UI-glue call.
   */
  private readonly palette = viewChild.required<CommandPaletteComponent>(CommandPaletteComponent);

  onResumeDownload(): void {
    if (this.isBrowser) {
      window.open('assets/resume.pdf', '_blank');
    }
  }

  onThemeToggle(): void {
    this.themeService.toggle();
  }

  /**
   * Open the command palette pre-filtered to theme actions. Invoked by:
   *   - the chevron next to the sidebar's theme toggle, and
   *   - Shift / Alt + click on either the sidebar toggle or the mobile
   *     theme FAB (handled below).
   */
  onThemePickerRequested(): void {
    this.palette().openWith('theme:');
  }

  /**
   * Plain palette-open from the mobile drawer footer — empty query so
   * the user lands on the unfiltered catalog (routes / blog / projects
   * / skills / themes). Closing-the-drawer responsibility lives in the
   * pill component itself so the modal stack stays clean.
   */
  onPaletteRequested(): void {
    this.palette().openWith('');
  }

  /**
   * Mobile FAB handler. Default click toggles between the user's last
   * dark / light pick; Shift / Alt + click opens the picker so the
   * single round button still surfaces both intents (matching the
   * sidebar contract on desktop).
   */
  onMobileThemeClick(event: MouseEvent | KeyboardEvent): void {
    if (event.shiftKey || event.altKey) {
      this.onThemePickerRequested();
    } else {
      this.onThemeToggle();
    }
  }
}
