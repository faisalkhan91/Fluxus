import {
  Service,
  signal,
  computed,
  inject,
  afterNextRender,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * A key combination matched against a `keydown` event. `mod` means the
 * platform command key (Cmd on macOS, Ctrl elsewhere); `ctrl` requires the
 * literal Control key cross-platform (used by the VS-Code-style Ctrl+` ).
 * Single-character `key`s are compared case-insensitively.
 */
export interface KeyCombo {
  key: string;
  mod?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface HotkeyBinding {
  /** Stable id; also the `trigger(id)` key. */
  id: string;
  /** Human description rendered by the keyboard-shortcuts overlay. */
  label: string;
  /** Grouping bucket in the shortcuts overlay (e.g. 'General'). */
  group: string;
  /** Display tokens for the overlay, e.g. `['Ctrl', '`']` or `['?']`. */
  keys: string[];
  /** When present the binding is matched on keydown; absent = display-only. */
  combo?: KeyCombo;
  /** Invoked on a match, or programmatically via `trigger(id)`. */
  handler?: () => void;
  /** Match even while an editable element is focused (e.g. the palette toggle, Esc). */
  allowInInput?: boolean;
  /** Extra runtime guard — the binding only fires when this returns true. */
  when?: () => boolean;
  /** Matched but omitted from the shortcuts overlay (per-overlay Esc handlers). */
  hidden?: boolean;
}

/**
 * Single source of truth for global keyboard shortcuts. Owns ONE
 * `window` keydown listener (instead of every overlay attaching its own and
 * fighting over `preventDefault`) and a registry of bindings that doubles as
 * the data the keyboard-shortcuts overlay renders — so the help can never
 * drift from what's actually wired.
 *
 * Overlays register their open/close bindings on construction and unregister
 * via the returned disposer. `activeOverlay` gives modal overlays a single
 * mutual-exclusion signal so two dialogs never stack.
 */
@Service()
export class HotkeyService {
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly registry = signal<HotkeyBinding[]>([]);

  /** Read-only view of registered bindings for the shortcuts overlay. */
  readonly bindings = computed<readonly HotkeyBinding[]>(() => this.registry());

  /**
   * Id of the overlay currently considered "open". Overlays set this on open
   * and watch it (via an effect) to self-close when another overlay takes
   * over, so two modal dialogs never stack.
   */
  readonly activeOverlay = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      const onKey = (event: KeyboardEvent) => this.dispatch(event);
      window.addEventListener('keydown', onKey);
      this.destroyRef.onDestroy(() => window.removeEventListener('keydown', onKey));
    });
  }

  /** Register a binding; returns a disposer to unregister it. */
  register(binding: HotkeyBinding): () => void {
    this.registry.update((list) => [...list, binding]);
    return () => this.registry.update((list) => list.filter((b) => b !== binding));
  }

  /** Programmatically invoke a binding's handler (palette actions, cross-overlay opens). */
  trigger(id: string): void {
    this.registry()
      .find((b) => b.id === id)
      ?.handler?.();
  }

  private dispatch(event: KeyboardEvent): void {
    const editable = isEditableTarget(event.target);
    for (const b of this.registry()) {
      if (!b.combo || !b.handler) continue;
      if (editable && !b.allowInInput) continue;
      if (b.when && !b.when()) continue;
      if (matches(event, b.combo)) {
        event.preventDefault();
        b.handler();
        return;
      }
    }
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function norm(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key;
}

function matches(event: KeyboardEvent, combo: KeyCombo): boolean {
  if (norm(event.key) !== norm(combo.key)) return false;
  if (combo.mod && !(event.metaKey || event.ctrlKey)) return false;
  if (combo.ctrl && !event.ctrlKey) return false;
  if (combo.shift !== undefined && event.shiftKey !== combo.shift) return false;
  if (combo.alt !== undefined && event.altKey !== combo.alt) return false;
  // When the combo needs no command/ctrl modifier, reject events that carry
  // one (so a plain '?' doesn't also fire on Ctrl+?). Shift is left alone —
  // shifted characters like '?' already carry it and `event.key` reflects it.
  if (!combo.mod && !combo.ctrl && (event.metaKey || event.ctrlKey || event.altKey)) return false;
  return true;
}
