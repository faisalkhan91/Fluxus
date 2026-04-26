import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastRegionComponent } from './toast-region.component';
import { ErrorToastService } from '@core/services/error-toast.service';

describe('ToastRegionComponent', () => {
  let fixture: ComponentFixture<ToastRegionComponent>;
  let host: HTMLElement;
  let toasts: ErrorToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToastRegionComponent] }).compileComponents();
    toasts = TestBed.inject(ErrorToastService);
    fixture = TestBed.createComponent(ToastRegionComponent);
    host = fixture.nativeElement as HTMLElement;
  });

  it('exposes the toast region landmark with an accessible label', () => {
    fixture.detectChanges();
    expect(host.getAttribute('role')).toBe('region');
    expect(host.getAttribute('aria-label')).toBe('Notifications');
  });

  it('renders nothing when the toast list is empty', () => {
    fixture.detectChanges();
    expect(host.querySelector('.toast')).toBeNull();
  });

  it('renders one toast per item with title and optional detail', () => {
    toasts.push({ title: 'Headline A', detail: 'Some detail' });
    toasts.push({ title: 'Headline B' });
    fixture.detectChanges();

    const rendered = host.querySelectorAll('.toast');
    expect(rendered.length).toBe(2);
    expect(rendered[0].querySelector('.toast-title')?.textContent?.trim()).toBe('Headline A');
    expect(rendered[0].querySelector('.toast-detail')?.textContent?.trim()).toBe('Some detail');
    expect(rendered[1].querySelector('.toast-detail')).toBeNull();
  });

  it('renders info toasts as polite status, error toasts as assertive alerts', () => {
    toasts.push({ title: 'Section link copied' });
    toasts.push({ severity: 'error', title: 'Chunk failed' });
    fixture.detectChanges();

    const [info, error] = host.querySelectorAll('.toast');
    expect(info.getAttribute('role')).toBe('status');
    expect(info.getAttribute('aria-live')).toBe('polite');
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.getAttribute('aria-live')).toBeNull();
  });

  it('renders an action button only when both actionLabel and action are set', () => {
    const action = vi.fn();
    toasts.push({ title: 'Chunk failed', actionLabel: 'Reload', action });
    toasts.push({ title: 'No action' });
    fixture.detectChanges();

    const buttons = host.querySelectorAll('.toast-action');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent?.trim()).toBe('Reload');
  });

  it('dismiss button removes the toast and the action button invokes its callback before dismissing', () => {
    const action = vi.fn();
    const id = toasts.push({ title: 'Chunk failed', actionLabel: 'Reload', action });
    fixture.detectChanges();

    const actionBtn = host.querySelector('.toast-action') as HTMLButtonElement;
    actionBtn.click();
    fixture.detectChanges();

    expect(action).toHaveBeenCalledTimes(1);
    expect(toasts.toasts().find((t) => t.id === id)).toBeUndefined();
  });

  it('dismiss-only click removes the toast from the list', () => {
    const id = toasts.push({ title: 'Standalone' });
    fixture.detectChanges();

    const dismissBtn = host.querySelector('.toast-dismiss') as HTMLButtonElement;
    expect(dismissBtn.getAttribute('aria-label')).toBe('Dismiss notification');
    dismissBtn.click();
    fixture.detectChanges();

    expect(toasts.toasts().find((t) => t.id === id)).toBeUndefined();
    expect(host.querySelector('.toast')).toBeNull();
  });
});
