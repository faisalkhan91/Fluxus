import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  viewChild,
  ElementRef,
  afterNextRender,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { assertNever } from '@shared/utils/exhaustive.utils';
import { CommandCatalogService, type CommandItem } from './command-catalog.service';

@Component({
  selector: 'ui-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  private router = inject(Router);
  private commandCatalog = inject(CommandCatalogService);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  protected input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected open = signal(false);
  protected query = signal('');
  protected highlighted = signal(0);

  protected filtered = computed<CommandItem[]>(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.commandCatalog.items();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.route?.toLowerCase().includes(q) ?? false) ||
        item.id.toLowerCase().includes(q) ||
        (item.keywords?.includes(q) ?? false),
    );
  });

  /**
   * DOM id of the currently-highlighted option, or `null` when the list is
   * empty. The input element binds this to `aria-activedescendant` so screen
   * readers announce arrow-key movement inside the listbox even though
   * keyboard focus stays on the input. WAI-ARIA combobox/listbox pattern.
   */
  protected activeDescendantId = computed<string | null>(() => {
    const list = this.filtered();
    if (list.length === 0) return null;
    const item = list[Math.min(this.highlighted(), list.length - 1)];
    return item?.domId ?? null;
  });

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      const onKey = (event: KeyboardEvent) => {
        // Cmd+K (mac) / Ctrl+K (everywhere else).
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          this.toggle();
        } else if (event.key === 'Escape' && this.open()) {
          this.close();
        }
      };
      window.addEventListener('keydown', onKey);
      this.destroyRef.onDestroy(() => window.removeEventListener('keydown', onKey));
    });
  }

  protected toggle(): void {
    if (this.open()) this.close();
    else this.openPalette();
  }

  protected openPalette(): void {
    this.open.set(true);
    this.query.set('');
    this.highlighted.set(0);
    queueMicrotask(() => {
      this.dialog()?.nativeElement.showModal?.();
      this.input()?.nativeElement.focus();
    });
  }

  /**
   * Opens the palette pre-filtered to a query string. Used by the
   * sidebar / mobile FAB to surface theme actions in one keystroke.
   */
  openWith(initialQuery: string): void {
    this.open.set(true);
    this.query.set(initialQuery);
    this.highlighted.set(0);
    queueMicrotask(() => {
      this.dialog()?.nativeElement.showModal?.();
      const el = this.input()?.nativeElement;
      if (el) {
        el.focus();
        // Place the caret at the end so the user can keep typing to
        // narrow the list further (e.g. `theme:tokyo`).
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    });
  }

  protected close(): void {
    this.dialog()?.nativeElement.close?.();
    this.open.set(false);
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.highlighted.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    const items = this.filtered();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlighted.update((i) => Math.min(items.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlighted.update((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[this.highlighted()];
      if (item) this.select(item);
    }
  }

  protected select(item: CommandItem): void {
    this.close();
    switch (item.kind) {
      case 'action':
        item.run?.();
        return;
      case 'route':
        if (!item.route) return;
        if (item.fragment) {
          this.router.navigate([item.route], { fragment: item.fragment });
        } else {
          this.router.navigate([item.route]);
        }
        return;
      default:
        // Exhaustive guard — adding a new CommandKind member surfaces
        // here as a compile error so an unhandled kind can't silently
        // close the palette without dispatching anything.
        return assertNever(item.kind);
    }
  }
}
