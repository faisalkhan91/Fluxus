import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Marks HTML as trusted, bypassing Angular's built-in sanitization.
 *
 * SECURITY: Only use this pipe for content from trusted sources (e.g. locally-authored
 * markdown rendered via marked + highlight.js). Angular's default sanitizer strips
 * class/style attributes needed for syntax highlighting. The strict CSP in nginx.conf
 * (`script-src 'self'`) provides defense-in-depth against inline script injection.
 */
@Pipe({ name: 'trustedHtml' })
export class TrustedHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
