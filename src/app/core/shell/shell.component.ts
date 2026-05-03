import {
  Component,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '@ui/sidebar/sidebar.component';
import { EditorTabBarComponent } from '@ui/editor-tab-bar/editor-tab-bar.component';
import { MobileNavPillComponent } from '@ui/mobile-nav-pill/mobile-nav-pill.component';
import { IconComponent } from '@ui/icon/icon.component';
import { ToastRegionComponent } from '@ui/toast-region/toast-region.component';
import { CommandPaletteComponent } from '@ui/command-palette/command-palette.component';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected media = inject(MediaQueryService);
  protected tabService = inject(TabService);
  protected navService = inject(NavigationService);
  protected themeService = inject(ThemeService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Reference to the command palette so the sidebar / FAB can pre-fill
   * the input with `theme:` and surface every theme entry in one tap.
   * Using `viewChild` keeps the wiring local to the shell instead of
   * routing through a service for what is essentially a UI-glue call.
   */
  private palette = viewChild.required<CommandPaletteComponent>(CommandPaletteComponent);

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
