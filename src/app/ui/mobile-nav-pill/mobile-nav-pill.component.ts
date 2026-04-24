import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  effect,
  input,
  signal,
  inject,
  viewChild,
} from '@angular/core';
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

  protected menuTrigger = viewChild<ElementRef<HTMLButtonElement>>('menuTrigger');
  protected menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');

  constructor() {
    effect(() => {
      const open = this.menuOpen();
      const panel = this.menuPanel();
      if (open && panel) {
        queueMicrotask(() => panel.nativeElement.focus());
      }
    });
  }

  openMenu(): void {
    this.menuOpen.set(true);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    queueMicrotask(() => this.menuTrigger()?.nativeElement.focus());
  }

  navigateTo(route: string): void {
    this.menuOpen.set(false);
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    if (route === '/') return this.router.url === '/';
    return this.router.url.startsWith(route);
  }

  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.menuPanel()?.nativeElement;
    if (!panel) return;

    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'));

    if (focusables.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = panel.ownerDocument.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first || active === panel) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
