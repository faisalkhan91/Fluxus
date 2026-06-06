import type { ElementRef } from '@angular/core';
import {
  Component,
  inject,
  signal,
  computed,
  effect,
  viewChild,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { HotkeyService } from '@core/services/hotkey.service';

const OVERLAY_ID = 'shortcuts';

interface ShortcutRow {
  label: string;
  keys: string[];
}
interface ShortcutGroup {
  group: string;
  items: ShortcutRow[];
}

/**
 * Keys that live inside the palette/terminal dialogs rather than as global
 * hotkeys — documented statically since they aren't dispatched by the
 * HotkeyService (they're handled within those components' own inputs).
 */
const IN_DIALOG_GROUP: ShortcutGroup = {
  group: 'Inside the palette & terminal',
  items: [
    { label: 'Navigate results', keys: ['↑', '↓'] },
    { label: 'Select / run', keys: ['↵'] },
    { label: 'Autocomplete a command (terminal)', keys: ['Tab'] },
    { label: 'Previous / next command (terminal)', keys: ['↑', '↓'] },
    { label: 'Close', keys: ['Esc'] },
  ],
};

/**
 * Keyboard-shortcuts help overlay (opens on `?`). Renders the live
 * HotkeyService registry grouped by `group` so it can never drift from the
 * shortcuts that are actually wired, plus a static section for the in-dialog
 * keys. Same native-`<dialog>` mechanics as the palette/terminal.
 */
@Component({
  selector: 'ui-shortcuts-help',
  templateUrl: './shortcuts-help.component.html',
  styleUrl: './shortcuts-help.component.css',
  imports: [IconComponent],
})
export class ShortcutsHelpComponent {
  private hotkeys = inject(HotkeyService);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  protected readonly open = signal(false);
  private previouslyFocused: HTMLElement | null = null;

  /** Registry bindings (minus hidden ones) grouped, then the static in-dialog keys. */
  protected readonly groups = computed<ShortcutGroup[]>(() => {
    const byGroup = new Map<string, ShortcutRow[]>();
    for (const b of this.hotkeys.bindings()) {
      if (b.hidden) continue;
      const rows = byGroup.get(b.group) ?? [];
      rows.push({ label: b.label, keys: b.keys });
      byGroup.set(b.group, rows);
    }
    const dynamic = [...byGroup.entries()].map(([group, items]) => ({ group, items }));
    return [...dynamic, IN_DIALOG_GROUP];
  });

  constructor() {
    this.destroyRef.onDestroy(
      this.hotkeys.register({
        id: OVERLAY_ID,
        label: 'Show keyboard shortcuts',
        group: 'General',
        keys: ['?'],
        combo: { key: '?' },
        handler: () => this.openHelp(),
      }),
    );
    this.destroyRef.onDestroy(
      this.hotkeys.register({
        id: 'shortcuts:close',
        label: 'Close',
        group: 'General',
        keys: ['Esc'],
        combo: { key: 'Escape' },
        allowInInput: true,
        when: () => this.open(),
        handler: () => this.close(),
        hidden: true,
      }),
    );

    effect(() => {
      if (this.hotkeys.activeOverlay() !== OVERLAY_ID && this.open()) {
        this.close();
      }
    });
  }

  protected openHelp(): void {
    this.captureFocus();
    this.hotkeys.activeOverlay.set(OVERLAY_ID);
    this.open.set(true);
    queueMicrotask(() => {
      this.dialog()?.nativeElement.showModal?.();
      this.closeButton()?.nativeElement.focus();
    });
  }

  protected close(): void {
    this.dialog()?.nativeElement.close?.();
    this.open.set(false);
    if (this.hotkeys.activeOverlay() === OVERLAY_ID) this.hotkeys.activeOverlay.set(null);
    this.restoreFocus();
  }

  private captureFocus(): void {
    if (!this.isBrowser) return;
    const active = document.activeElement;
    this.previouslyFocused =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }

  private restoreFocus(): void {
    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    if (!target?.isConnected || typeof target.focus !== 'function') return;
    queueMicrotask(() => target.focus());
  }
}
