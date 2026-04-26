import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Identifier for the trust *source* of the HTML being passed in. Today
 * the only accepted value is `'local-markdown'` — strings produced by
 * our own `MarkdownService` (`marked` + `highlight.js` against
 * locally-authored `.md` files in `src/assets/blog/posts`). Anything
 * else is rejected at runtime so a future reuse of this pipe can't
 * silently inherit a `bypassSecurityTrustHtml` for, say, a CMS-fed
 * description without explicit security review.
 *
 * Add new variants here only after the corresponding sanitiser /
 * trust-boundary review has been signed off.
 */
export type TrustedHtmlSource = 'local-markdown';

/**
 * Marks HTML as trusted, bypassing Angular's built-in sanitization.
 *
 * SECURITY: Only use this pipe for content from trusted sources (e.g.
 * locally-authored markdown rendered via marked + highlight.js). Angular's
 * default sanitizer strips class/style attributes needed for syntax
 * highlighting. The strict CSP in `nginx.conf` (`script-src 'self'`)
 * provides defense-in-depth against inline script injection.
 *
 * Callers MUST supply an explicit `source` argument in the template:
 *
 *     {{ content() | trustedHtml: 'local-markdown' }}
 *
 * — invocations without a recognised source throw eagerly so a misuse is
 * a noisy unit-test failure rather than a silent XSS vector.
 */
@Pipe({ name: 'trustedHtml' })
export class TrustedHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(html: string, source: TrustedHtmlSource): SafeHtml {
    if (source !== 'local-markdown') {
      throw new Error(
        `[TrustedHtmlPipe] Refusing to bypass sanitisation for unknown source "${String(source)}". ` +
          `Add a new branch (and document the trust boundary) before passing untrusted HTML through this pipe.`,
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
