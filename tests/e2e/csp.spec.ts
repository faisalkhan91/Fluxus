import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PRERENDERED_ROUTES, expect, test } from './fixtures';

/**
 * Hermetic CSP regression spec. The Playwright webServer in
 * playwright.config.ts uses `http-server`, which knows nothing about the
 * nginx config — so we read the CSP value out of the generated
 * `dist/fluxus/security-headers.conf` and inject it onto every navigation
 * response via `page.route()`. The CSP we inject is the exact byte-for-byte
 * string the production nginx sends, so coverage is equivalent to running
 * against nginx.
 *
 * Failure mode this catches: any inline event handler (e.g. Beasties'
 * `onload="this.media='all'"`) or inline <script> body whose hash is not
 * in `script-src` will be blocked by the browser and surface as a
 * `Refused to ...` console error or a CSP-shaped pageerror. The asserts
 * below fail the run on any such message, so a future change that emits
 * a new inline pattern without updating the CSP allowlist will break this
 * spec instead of breaking real users.
 */

const SECURITY_HEADERS_FILE = resolve(process.cwd(), 'dist/fluxus/security-headers.conf');
// Pull `add_header Content-Security-Policy "..." always;` out of the generated
// nginx snippet. Done at module load (not in beforeAll) so the file's absence
// is a clear errored test discovery rather than a runtime failure.
const headers = readFileSync(SECURITY_HEADERS_FILE, 'utf-8');
const cspMatch = headers.match(/Content-Security-Policy\s+"([^"]+)"/);
if (!cspMatch) {
  throw new Error(
    `Could not parse Content-Security-Policy from ${SECURITY_HEADERS_FILE}. ` +
      `Run \`npm run build:prod\` first.`,
  );
}
const PROD_CSP = cspMatch[1];

// A console error or pageerror is treated as a CSP violation if its text
// matches either the spec wording ("Content Security Policy") or the
// browser's per-violation prefix ("Refused to load|execute|apply"). Both
// shapes appear in Chromium logs, depending on the directive that fired.
const CSP_VIOLATION_PATTERN = /Content[- ]Security[- ]Policy|Refused to (load|execute|apply)/i;

test.describe('Content Security Policy (hermetic, prod CSP injected)', () => {
  for (const route of PRERENDERED_ROUTES) {
    test(`no CSP violations on ${route}`, async ({ page }) => {
      // page.route fires for every request; we tag the document response with
      // the production CSP and pass everything else through untouched. The
      // browser then enforces the CSP exactly as it would in production.
      await page.route('**/*', async (handler) => {
        const response = await handler.fetch();
        const headers = response.headers();
        const isDoc = (headers['content-type'] ?? '').includes('text/html');
        if (isDoc) {
          headers['content-security-policy'] = PROD_CSP;
        }
        await handler.fulfill({ response, headers });
      });

      const violations: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (CSP_VIOLATION_PATTERN.test(text)) violations.push(`console: ${text}`);
      });
      page.on('pageerror', (err) => {
        const text = err.message;
        if (CSP_VIOLATION_PATTERN.test(text)) violations.push(`pageerror: ${text}`);
      });

      // `networkidle` waits long enough for Beasties' deferred stylesheet load
      // and any async chunks to settle, so CSP violations against late-loaded
      // resources surface before we assert.
      await page.goto(route, { waitUntil: 'networkidle' });

      expect(violations, `CSP violations on ${route}:\n  ${violations.join('\n  ')}`).toEqual([]);
    });
  }
});
