import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplicationRef } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ShortcutsHelpComponent } from './shortcuts-help.component';

describe('ShortcutsHelpComponent', () => {
  let fixture: ComponentFixture<ShortcutsHelpComponent>;
  let component: ShortcutsHelpComponent;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ShortcutsHelpComponent] }).compileComponents();
    fixture = TestBed.createComponent(ShortcutsHelpComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  function inner(): { open: () => boolean } {
    return component as unknown as ReturnType<typeof inner>;
  }

  it('starts closed and opens on "?"', () => {
    expect(inner().open()).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    expect(inner().open()).toBe(true);
  });

  it('exposes a labelled modal dialog', () => {
    const dialog = host.querySelector('dialog[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-label')).toBe('Keyboard shortcuts');
  });

  it('lists the registered "?" shortcut and the static in-dialog group', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    fixture.detectChanges();
    const labels = Array.from(host.querySelectorAll('.sc-row-label')).map(
      (el) => el.textContent?.trim() ?? '',
    );
    expect(labels).toContain('Show keyboard shortcuts');
    expect(labels).toContain('Select / run');
    // The group headers include the static in-dialog section.
    const groups = Array.from(host.querySelectorAll('.sc-group-title')).map(
      (el) => el.textContent?.trim() ?? '',
    );
    expect(groups).toContain('Inside the palette & terminal');
  });

  it('does not list hidden (Esc close) bindings', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    fixture.detectChanges();
    // Only the static group should contribute an Esc row; the per-overlay
    // hidden "Close" bindings must not appear as their own rows.
    const escRows = Array.from(host.querySelectorAll('.sc-row-label')).filter(
      (el) => el.textContent?.trim() === 'Close',
    );
    expect(escRows.length).toBe(1);
  });

  it('Escape closes and restores focus to the trigger', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    try {
      trigger.focus();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
      await new Promise<void>((r) => queueMicrotask(() => r()));
      expect(inner().open()).toBe(true);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await new Promise<void>((r) => queueMicrotask(() => r()));
      expect(inner().open()).toBe(false);
      expect(document.activeElement).toBe(trigger);
    } finally {
      trigger.remove();
    }
  });
});
