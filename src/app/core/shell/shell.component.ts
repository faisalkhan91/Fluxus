import { Component, ChangeDetectionStrategy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../ui/sidebar/sidebar.component';
import { EditorTabBarComponent } from '../../ui/editor-tab-bar/editor-tab-bar.component';
import { MobileNavPillComponent } from '../../ui/mobile-nav-pill/mobile-nav-pill.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { ToastRegionComponent } from '../../ui/toast-region/toast-region.component';
import { CommandPaletteComponent } from '../../ui/command-palette/command-palette.component';
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

  onResumeDownload(): void {
    if (this.isBrowser) {
      window.open('assets/resume.pdf', '_blank');
    }
  }

  onThemeToggle(): void {
    this.themeService.toggle();
  }
}
