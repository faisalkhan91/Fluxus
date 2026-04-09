import { Component, ChangeDetectionStrategy, input, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

export interface MobileNavItem {
  label: string;
  route: string;
  icon: string;
}

export type MobileMenuItem =
  | { type: 'link'; label: string; route: string; icon: string }
  | { type: 'divider'; label: string };

@Component({
  selector: 'ui-mobile-nav-pill',
  templateUrl: './mobile-nav-pill.component.html',
  styleUrl: './mobile-nav-pill.component.css',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'navigation',
    'aria-label': 'Main Navigation',
  },
})
export class MobileNavPillComponent {
  private router = inject(Router);

  items = input<MobileNavItem[]>([]);
  menuItems = input<MobileMenuItem[]>([]);

  menuOpen = signal(false);

  openMenu(): void {
    this.menuOpen.set(true);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  navigateTo(route: string): void {
    this.menuOpen.set(false);
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    if (route === '/') return this.router.url === '/';
    return this.router.url.startsWith(route);
  }
}
