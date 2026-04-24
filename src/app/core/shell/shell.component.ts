import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../ui/sidebar/sidebar.component';
import { EditorTabBarComponent } from '../../ui/editor-tab-bar/editor-tab-bar.component';
import { MobileNavPillComponent } from '../../ui/mobile-nav-pill/mobile-nav-pill.component';
import { IconComponent } from '../../ui/icon/icon.component';
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sidebar-visible]': 'media.showSidebar()',
    '[class.sidebar-collapsed]': 'media.sidebarCollapsed()',
    '[class.mobile]': 'media.isMobile()',
  },
})
export class ShellComponent {
  protected media = inject(MediaQueryService);
  protected tabService = inject(TabService);
  protected navService = inject(NavigationService);
  protected themeService = inject(ThemeService);

  onResumeDownload(): void {
    if (typeof window !== 'undefined') {
      window.open('assets/resume.pdf', '_blank');
    }
  }

  onThemeToggle(): void {
    this.themeService.toggle();
  }
}
