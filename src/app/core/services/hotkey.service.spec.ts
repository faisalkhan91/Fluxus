import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HotkeyService } from './hotkey.service';

/** Dispatch a window keydown the way a real key press would surface. */
function press(init: KeyboardEventInit): void {
  window.dispatchEvent(new KeyboardEvent('keydown', init));
}

describe('HotkeyService', () => {
  let service: HotkeyService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HotkeyService);
    // afterNextRender attaches the single window keydown listener.
    await TestBed.inject(ApplicationRef).whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('fires a mod-key binding on Cmd+K and Ctrl+K', () => {
    const handler = vi.fn();
    service.register({
      id: 'p',
      label: 'Palette',
      group: 'General',
      keys: ['K'],
      combo: { key: 'k', mod: true },
      handler,
    });
    press({ key: 'k', metaKey: true });
    press({ key: 'k', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('matches Ctrl+` but not a bare backtick', () => {
    const handler = vi.fn();
    service.register({
      id: 't',
      label: 'Terminal',
      group: 'General',
      keys: ['Ctrl', '`'],
      combo: { key: '`', ctrl: true },
      handler,
    });
    press({ key: '`' });
    expect(handler).not.toHaveBeenCalled();
    press({ key: '`', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('matches a bare "?" but rejects it with a command modifier', () => {
    const handler = vi.fn();
    service.register({
      id: 's',
      label: 'Shortcuts',
      group: 'General',
      keys: ['?'],
      combo: { key: '?' },
      handler,
    });
    press({ key: '?', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
    press({ key: '?' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('skips bindings while an editable element is focused unless allowInInput', () => {
    const guarded = vi.fn();
    const global = vi.fn();
    service.register({
      id: 'g',
      label: '?',
      group: 'General',
      keys: ['?'],
      combo: { key: '?' },
      handler: guarded,
    });
    service.register({
      id: 'k',
      label: 'K',
      group: 'General',
      keys: ['K'],
      combo: { key: 'k', mod: true },
      allowInInput: true,
      handler: global,
    });

    const inputEl = document.createElement('input');
    document.body.appendChild(inputEl);
    try {
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
      expect(guarded).not.toHaveBeenCalled();
      inputEl.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
      );
      expect(global).toHaveBeenCalledTimes(1);
    } finally {
      inputEl.remove();
    }
  });

  it('respects the `when` guard', () => {
    let open = false;
    const handler = vi.fn();
    service.register({
      id: 'esc',
      label: 'Close',
      group: 'General',
      keys: ['Esc'],
      combo: { key: 'Escape' },
      when: () => open,
      handler,
    });
    press({ key: 'Escape' });
    expect(handler).not.toHaveBeenCalled();
    open = true;
    press({ key: 'Escape' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('trigger(id) invokes a handler programmatically', () => {
    const handler = vi.fn();
    service.register({
      id: 'open-terminal',
      label: 'Terminal',
      group: 'General',
      keys: [],
      handler,
    });
    service.trigger('open-terminal');
    expect(handler).toHaveBeenCalledTimes(1);
    service.trigger('nope'); // unknown id is a no-op
  });

  it('the disposer unregisters the binding', () => {
    const handler = vi.fn();
    const dispose = service.register({
      id: 'k',
      label: 'K',
      group: 'General',
      keys: ['K'],
      combo: { key: 'k', mod: true },
      handler,
    });
    dispose();
    press({ key: 'k', metaKey: true });
    expect(handler).not.toHaveBeenCalled();
    expect(service.bindings()).toHaveLength(0);
  });

  it('exposes activeOverlay as a writable mutual-exclusion signal', () => {
    expect(service.activeOverlay()).toBeNull();
    service.activeOverlay.set('terminal');
    expect(service.activeOverlay()).toBe('terminal');
  });
});
