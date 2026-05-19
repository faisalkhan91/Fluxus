import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  effect,
  input,
  output,
  signal,
  inject,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

export interface MobileNavItem {
  label: string;
  route: string;
  icon: string;
}

export type MobileMenuItem =
  | {
      type: 'link';
      label: string;
      route: string;
      icon: string;
      /**
       * IDE-themed file-extension chip rendered to the right of the
       * label (`.md`, `.rss`, `.ts`, `.json`, …). Matches the desktop
       * sidebar's nav-ext column so the brand voice carries on phones.
       * Optional because the home entry has `.tsx` while a few special
       * entries omit it.
       */
      ext?: string;
    }
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
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  items = input.required<MobileNavItem[]>();
  menuItems = input.required<MobileMenuItem[]>();

  /**
   * Drawer-footer parity actions. These exist on the desktop sidebar
   * (Cmd+K palette, theme picker chevron, "Download Resume" CTA) but
   * have no on-screen entry point on phones today — the shell wires
   * each output to the same handler the desktop sidebar uses, so the
   * two surfaces stay behaviour-equivalent.
   */
  paletteRequested = output<void>();
  themePickerRequested = output<void>();
  resumeRequested = output<void>();

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
      this.toggleBackgroundInert(open);
    });
    // Defensive cleanup: if the component is destroyed while the menu
    // is open (route change cancelling the modal mid-flow), strip the
    // inert attributes so the rest of the app stays interactive on
    // the next page.
    this.destroyRef.onDestroy(() => this.toggleBackgroundInert(false));
  }

  /**
   * Block AT / keyboard from reaching site chrome while the menu modal
   * is open. `aria-modal="true"` on the dialog is technically sufficient
   * per ARIA spec, but its enforcement varies across SR + browser
   * combinations — `inert` is the unambiguous belt-and-braces guard.
   *
   * Targets the three top-level shell containers that aren't the modal:
   * the site banner (sidebar), the main-area (editor tab bar + content
   * + router outlet), and the mobile theme FAB. The toast region stays
   * reachable so a toast action ("Update available — Reload") still
   * works with the menu open. The command palette manages its own
   * modal state.
   */
  private toggleBackgroundInert(inert: boolean): void {
    const targets = [
      this.document.querySelector('header[role="banner"]'),
      this.document.querySelector('.main-area'),
      this.document.querySelector('.mobile-theme-toggle'),
    ];
    for (const el of targets) {
      if (!el) continue;
      if (inert) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    }
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

  /**
   * Emit a footer-action and close the drawer. Closing first matters
   * for the palette + theme-picker actions because the palette is also
   * a `<dialog>` modal — leaving the drawer open would stack two
   * overlays + two `inert` regions on top of each other and trap focus
   * in the wrong layer.
   */
  protected emitPalette(): void {
    this.menuOpen.set(false);
    this.paletteRequested.emit();
  }

  protected emitThemePicker(): void {
    this.menuOpen.set(false);
    this.themePickerRequested.emit();
  }

  protected emitResume(): void {
    this.menuOpen.set(false);
    this.resumeRequested.emit();
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
