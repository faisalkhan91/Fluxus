import { Injectable, signal } from '@angular/core';

/**
 * Severity controls how aggressively the toast is announced to assistive
 * technology. `'error'` maps to `role="alert"` (assertive — interrupts
 * whatever the SR is reading) and is reserved for failures that actively
 * block the user (chunk-load, network drops). `'info'` (the default) maps
 * to `role="status"` + `aria-live="polite"`, which queues the announcement
 * after the current SR utterance — appropriate for confirmations like
 * "Section link copied" that don't demand immediate attention.
 *
 * WAI-ARIA Authoring Practices, "Live Region Roles": status vs alert.
 */
export type ToastSeverity = 'info' | 'error';

export interface ErrorToast {
  /** Stable id so the host can dedupe and animate exits. */
  id: number;
  /** Headline shown to the user. */
  title: string;
  /** Optional body / hint. */
  detail?: string;
  /** Action button label (renders only when set). */
  actionLabel?: string;
  /** Action callback invoked when the user clicks the action button. */
  action?: () => void;
  /**
   * Defaults to `'info'`. Only set `'error'` when the toast describes a
   * genuinely urgent / blocking failure — over-using `'error'` is the same
   * WCAG smell that the per-item `role="alert"` had before.
   */
  severity?: ToastSeverity;
}

/**
 * Tiny pub-sub for non-blocking error toasts. The shell renders any toasts in
 * the toast region; the global ErrorHandler pushes them on chunk-load and
 * other recoverable failures.
 */
@Injectable({ providedIn: 'root' })
export class ErrorToastService {
  private nextId = 1;
  readonly toasts = signal<ErrorToast[]>([]);

  push(toast: Omit<ErrorToast, 'id'>): number {
    const id = this.nextId++;
    this.toasts.update((current) => [...current, { id, ...toast }]);
    return id;
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
