import { Service, inject } from '@angular/core';
import { ErrorToastService } from '@core/services/error-toast.service';
import { copyToClipboard } from '@shared/utils/clipboard.utils';

/**
 * Owns the "Copy" button behaviour for rendered code blocks: a delegated
 * click handler that copies the snippet and pulses the button's label.
 * Extracted from `BlogPostComponent` (feature layer). Uses `closest()`
 * dispatch and its own timer set so it's fully independent of the
 * heading-anchor handler attached to the same root.
 */
@Service()
export class CopyCodeService {
  private toasts = inject(ErrorToastService);

  /**
   * Tracks the fire-and-forget label-reset `setTimeout`s so they cancel on
   * detach and never touch a torn-down node.
   */
  private timers = new Set<ReturnType<typeof setTimeout>>();

  /**
   * Attach a delegated click handler for `.copy-btn` buttons under `root`.
   * Returns a disposer that removes the listener and clears pending timers.
   */
  attach(root: HTMLElement): () => void {
    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('.copy-btn') as HTMLButtonElement | null;
      if (!button) return;
      const code = button.parentElement?.querySelector('code')?.textContent ?? '';
      const ok = await copyToClipboard(code);
      if (!ok) {
        this.toasts.push({
          title: 'Could not copy the snippet',
          detail: 'Your browser blocked clipboard access. Select the code manually instead.',
        });
        return;
      }
      // Mutate the inner `.copy-btn-label` span (which carries
      // `aria-live="polite"`) rather than the button's own textContent. Live
      // regions are most reliably announced when the live element existed in
      // the DOM *before* the mutation and only its text node changes —
      // toggling the button's own text was silently dropped by some
      // SR + browser combinations on touch devices.
      const label = button.querySelector<HTMLSpanElement>('.copy-btn-label');
      if (!label) return;
      const originalText = label.textContent;
      const originalLabel = button.getAttribute('aria-label');
      label.textContent = 'Copied!';
      button.setAttribute('aria-label', 'Code copied to clipboard');
      button.classList.add('copy-btn--copied');
      this.scheduleTimeout(() => {
        label.textContent = originalText;
        if (originalLabel !== null) button.setAttribute('aria-label', originalLabel);
        button.classList.remove('copy-btn--copied');
      }, 1500);
    };
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
      for (const id of this.timers) clearTimeout(id);
      this.timers.clear();
    };
  }

  private scheduleTimeout(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }
}
