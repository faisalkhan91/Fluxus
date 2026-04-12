import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
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
    role: 'navigation',
    'aria-label': 'Main Navigation',
  },
})
export class SidebarComponent {
  items = input<SidebarItem[]>([]);
  collapsed = input(false);
  isDark = input(true);
  resumeClicked = output<void>();
  themeToggled = output<void>();
}
