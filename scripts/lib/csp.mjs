/**
 * Shared CSP-scanning primitives for build-csp (which writes the
 * security-headers.conf script-src allowlist) and audit-csp (which verifies
 * it). Both used to copy-paste the inline-`<script>` regex, the
 * executable-type test, and the sha256 token helper — drift between the two
 * meant the audit could pass against a CSP that didn't actually match what
 * build-csp would emit. Keeping them here makes that impossible.
 */
import { createHash } from 'node:crypto';

/** Matches an inline or external `<script ...>...</script>`; capture 1 = attrs, 2 = body. */
export const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

/**
 * `type` values the browser actually executes as JS. Data blocks like
 * `application/ld+json` or `application/json` (Angular TransferState) are
 * not executed and so don't trigger script-src — they need no hash.
 */
export const EXECUTABLE_TYPES = [
  '',
  'text/javascript',
  'application/javascript',
  'application/ecmascript',
  'text/ecmascript',
  'module',
];

/**
 * True when a `<script>`'s attribute string denotes an inline executable
 * script that needs a script-src hash. External scripts (`src=`) are covered
 * by `'self'`; non-executable `type`s are ignored.
 */
export function isInlineExecutable(attrs) {
  if (/\bsrc\s*=/i.test(attrs)) return false;
  const typeMatch = attrs.match(/type\s*=\s*["']?([^"'\s>]+)["']?/i);
  const type = typeMatch ? typeMatch[1].toLowerCase() : '';
  return EXECUTABLE_TYPES.includes(type);
}

/** Compute the `'sha256-...'` CSP source token for an inline body/handler value. */
export function sha256Token(value) {
  const digest = createHash('sha256').update(value, 'utf-8').digest('base64');
  return `'sha256-${digest}'`;
}
