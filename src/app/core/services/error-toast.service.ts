import { Injectable, signal } from '@angular/core';

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
