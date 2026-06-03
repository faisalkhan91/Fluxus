import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ErrorToastService } from '@core/services/error-toast.service';
import { environment } from '@env/environment';
import { copyToClipboard } from '@shared/utils/clipboard.utils';
import { prefersReducedMotion } from '@shared/utils/motion.utils';

/**
 * Owns the heading-permalink behaviour for rendered blog posts: rewriting
 * the `[data-anchor-id]` anchors `MarkdownService` emits so their `href`
 * resolves against the post URL, and the delegated click handler that
 * copies a section link without bouncing the reader to the site root.
 *
 * Extracted from `BlogPostComponent` (feature layer, mirrors
 * `MermaidService` / `BlogPostSeoService`). Uses `closest()` dispatch so it
 * can own its own delegated listener independently of the copy-code one.
 */
@Injectable({ providedIn: 'root' })
export class HeadingAnchorService {
  private document = inject(DOCUMENT);
  private toasts = inject(ErrorToastService);

  /**
   * Rewrite every `[data-anchor-id]` permalink under `root` so its `href`
   * resolves against `/blog/<slug>` instead of the `<base href="/">` site
   * root (which would navigate the reader home and lose their place). The
   * data attribute is the stable id; the href is cosmetic ("copy link as").
   */
  rewriteHrefs(root: HTMLElement, slug: string): void {
    if (!slug) return;
    const base = `/blog/${slug}`;
    root.querySelectorAll<HTMLAnchorElement>('.anchor[data-anchor-id]').forEach((a) => {
      const id = a.getAttribute('data-anchor-id') ?? '';
      if (!id) return;
      a.setAttribute('href', `${base}#${id}`);
    });
  }

  /**
   * Attach a delegated click handler for permalink anchors under `root`.
   * Returns a disposer. `getSlug` is read per click so the handler stays
   * correct across in-app navigation between posts.
   */
  attach(root: HTMLElement, getSlug: () => string): () => void {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('.anchor[data-anchor-id]') as HTMLAnchorElement | null;
      if (anchor) void this.handleAnchorClick(event, anchor, getSlug());
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }

  private async handleAnchorClick(
    event: MouseEvent,
    anchor: HTMLAnchorElement,
    slug: string,
  ): Promise<void> {
    // Modifier / non-primary clicks fall through to the browser so
    // "open in new tab" / "copy link" keep working.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    const id = anchor.getAttribute('data-anchor-id') ?? '';
    if (!id || !slug) return;
    const path = `/blog/${slug}#${id}`;
    // Guard `window.history` independently of `window`: exotic shells expose
    // `window` without `history`.
    const history = typeof window !== 'undefined' ? window.history : undefined;
    if (history) {
      history.replaceState(history.state, '', path);
      const target = this.document.getElementById(id);
      if (target) {
        // Honour reduced-motion at click time: `'instant'` beats the global
        // `scroll-behavior` CSS rule for motion-sensitive users (WCAG 2.3.3).
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? 'instant' : 'smooth',
          block: 'start',
        });
        // Move focus to the heading so the next Tab continues from there.
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
    if (await copyToClipboard(`${environment.siteUrl}${path}`)) {
      this.toasts.push({
        title: 'Section link copied',
        detail: 'A link to this section is now on your clipboard.',
      });
    }
  }
}
