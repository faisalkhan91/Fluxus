import { Service, signal } from '@angular/core';

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
  /**
   * Auto-dismiss delay in milliseconds. When omitted, defaults to
   * `DEFAULT_INFO_TTL` for `'info'`-severity toasts and `null` (sticky)
   * for `'error'`-severity toasts. Pass `null` explicitly to keep an
   * info toast visible until manually dismissed; pass a number on an
   * error toast to give it a hard ceiling.
   */
  ttl?: number | null;
}

/**
 * Default time-to-live for `'info'`-severity toasts. Long enough to
 * read a one-line confirmation ("Section link copied"), short enough
 * that rapid actions (copying multiple section links in a row) don't
 * accumulate a stack the user has to manually dismiss.
 */
const DEFAULT_INFO_TTL = 4000;

/**
 * Tiny pub-sub for non-blocking error toasts. The shell renders any toasts in
 * the toast region; the global ErrorHandler pushes them on chunk-load and
 * other recoverable failures.
 *
 * `'info'` toasts auto-dismiss after `DEFAULT_INFO_TTL` ms by default —
 * a clipboard "copied" confirmation should not linger forever and stack
 * up on rapid use. `'error'` toasts stay sticky because they describe
 * failures the user should acknowledge. Either default can be overridden
 * per-call via the `ttl` field (number = explicit ms, `null` = sticky).
 */
@Service()
export class ErrorToastService {
  private nextId = 1;
  /**
   * Pending auto-dismiss timer handles, keyed by toast id. Tracking them
   * means a manual `dismiss(id)` can cancel the still-scheduled timer
   * (preventing a no-op `dismiss` callback firing later) and a `clear()`
   * can cancel everything in one pass.
   */
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = signal<ErrorToast[]>([]);

  push(toast: Omit<ErrorToast, 'id'>): number {
    const id = this.nextId++;
    const severity: ToastSeverity = toast.severity ?? 'info';
    const ttl = this.resolveTtl(severity, toast.ttl);
    this.toasts.update((current) => [...current, { id, ...toast, severity }]);
    if (ttl != null) {
      const handle = setTimeout(() => {
        this.timers.delete(id);
        this.dismiss(id);
      }, ttl);
      this.timers.set(id, handle);
    }
    return id;
  }

  dismiss(id: number): void {
    const handle = this.timers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.timers.delete(id);
    }
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    for (const handle of this.timers.values()) clearTimeout(handle);
    this.timers.clear();
    this.toasts.set([]);
  }

  private resolveTtl(severity: ToastSeverity, override: number | null | undefined): number | null {
    if (override === null) return null;
    if (typeof override === 'number') return override;
    return severity === 'error' ? null : DEFAULT_INFO_TTL;
  }
}
