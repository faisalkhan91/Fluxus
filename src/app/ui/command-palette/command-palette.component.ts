import type { ElementRef } from '@angular/core';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  viewChild,
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

  protected readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly highlighted = signal(0);

  /**
   * Element that owned focus when the palette opened — restored when
   * the palette closes so keyboard users land back where they were
   * (industry-standard a11y pattern: every modal that takes focus
   * gives it back). Plain field, not a signal, because we never need
   * to observe its changes; only the open/close paths read or write.
   */
  private previouslyFocused: HTMLElement | null = null;

  protected readonly filtered = computed<CommandItem[]>(() => {
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
  protected readonly activeDescendantId = computed<string | null>(() => {
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
    this.captureFocus();
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
    this.captureFocus();
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
    this.restoreFocus();
  }

  /**
   * Snapshot the element that owned focus right before the palette
   * took over. SSR-guarded; bails on `document.body` so a user who
   * arrived via Cmd+K with nothing focused doesn't get a phantom
   * "focus shifted to body" on close. Called from both open paths.
   */
  private captureFocus(): void {
    if (!this.isBrowser) return;
    const active = document.activeElement;
    this.previouslyFocused =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }

  /**
   * Hand focus back to whoever had it before the palette opened.
   * Skipped when the previous element is gone from the DOM (e.g. the
   * mobile drawer's Search button — the drawer unmounts before the
   * palette closes), so we don't try to focus a detached node and
   * crash on Safari. Async via `queueMicrotask` so the dialog's
   * own `close()` fully runs first; otherwise focus management
   * inside the close transition can fight ours.
   */
  private restoreFocus(): void {
    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    if (!target?.isConnected || typeof target.focus !== 'function') return;
    queueMicrotask(() => target.focus());
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
      this.scrollActiveIntoView();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlighted.update((i) => Math.max(0, i - 1));
      this.scrollActiveIntoView();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[this.highlighted()];
      if (item) this.select(item);
    }
  }

  /**
   * Keeps the option pointed at by `aria-activedescendant` visible inside
   * the listbox after each arrow-key move. Without this, a long catalog
   * (routes + blog posts + projects + skills + themes routinely tops 40
   * entries) lets keyboard users scroll past the rendered viewport — the
   * highlighted option is announced to screen readers but invisible to
   * sighted users, and the relationship asserted by aria-activedescendant
   * silently breaks. WCAG 2.4.8 (Focus Visible).
   *
   * Mirrors the same scrollIntoView({ block: 'nearest' }) pattern the
   * mobile-nav-pill uses to centre the active route after the drawer
   * opens. Async via queueMicrotask so the highlight signal's downstream
   * recompute (active-descendant id) settles before we look it up.
   */
  private scrollActiveIntoView(): void {
    if (!this.isBrowser) return;
    queueMicrotask(() => {
      const id = this.activeDescendantId();
      if (!id) return;
      const target = this.dialog()?.nativeElement.querySelector(`#${id}`);
      // jsdom (and a handful of older webviews) don't implement
      // scrollIntoView. Guard so the method is a no-op there rather
      // than crashing the keystroke pipeline.
      target?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  protected select(item: CommandItem): void {
    switch (item.kind) {
      case 'action':
        // Action items (theme switch, etc.) don't navigate, so focus
        // restoration to the original trigger is what the keyboard
        // user expects after the palette dismisses.
        this.close();
        item.run?.();
        return;
      case 'route':
        if (!item.route) return;
        // Discard the captured-focus reference before closing — the
        // upcoming navigation will own focus management (Angular
        // routes the activeElement to the new route's content), and
        // restoring focus to a button on the *outgoing* route would
        // fight that briefly before the element unmounts.
        this.previouslyFocused = null;
        this.close();
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
