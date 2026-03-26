import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

export interface MobileNavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'ui-mobile-nav-pill',
  templateUrl: './mobile-nav-pill.component.html',
  styleUrl: './mobile-nav-pill.component.css',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'navigation',
    'aria-label': 'Main Navigation',
  },
})
export class MobileNavPillComponent {
  items = input<MobileNavItem[]>([]);
}
