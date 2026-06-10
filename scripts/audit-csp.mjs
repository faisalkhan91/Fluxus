#!/usr/bin/env node
/**
 * Static CSP regression check for the prerendered build.
 *
 * Walks every HTML file under `dist/fluxus/browser/` and verifies that
 * `dist/fluxus/security-headers.conf` actually allows every inline thing
 * that file is going to try to execute:
 *
 *   - Inline event handler attributes (`onload="..."`, `onclick="..."`, etc.)
 *     -> require both `'unsafe-hashes'` AND a matching `'sha256-...'` token
 *        in `script-src`. If either is missing the browser silently drops
 *        the handler and the page renders broken (this is exactly the
 *        Beasties `onload="this.media='all'"` regression that motivated
 *        this script).
 *
 *   - Inline `<script>` bodies -> require a matching `'sha256-...'` token
 *     in `script-src`. Overlaps with build-csp.mjs but catches drift if
 *     anything post-processes the HTML between build-csp.mjs and deploy.
 *
 * Run via `npm run audit:csp` (chained at the end of `build:prod`).
 */
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIST_BROWSER, requireDistBrowser, walk } from './lib/fs.mjs';
import { SCRIPT_TAG, isInlineExecutable, sha256Token, MAX_NGINX_LINE } from './lib/csp.mjs';
import { nonCspAddHeaderLines } from './lib/headers.mjs';

const HEADERS_FILE = join(process.cwd(), 'dist/fluxus/security-headers.conf');

requireDistBrowser();
if (!statSync(HEADERS_FILE, { throwIfNoEntry: false })?.isFile()) {
  console.error(`${HEADERS_FILE} does not exist — run scripts/build-csp.mjs first.`);
  process.exit(1);
}

const headersText = readFileSync(HEADERS_FILE, 'utf-8');

// Pull the CSP value out of the `add_header Content-Security-Policy "..."` line.
const cspMatch = headersText.match(/Content-Security-Policy\s+"([^"]+)"/);
if (!cspMatch) {
  console.error(`Could not find a Content-Security-Policy header in ${HEADERS_FILE}.`);
  process.exit(1);
}
const csp = cspMatch[1];

// Defense-in-depth: re-assert the NGINX line-length ceiling here too. build-csp.mjs
// already fails on overflow, but the header file can be hand-edited or post-processed
// between generation and deploy. An over-long CSP makes NGINX drop the header and
// serve no policy at all, so catch it before it ships.
if (csp.length > MAX_NGINX_LINE) {
  console.error(
    `✗ csp-audit: Content-Security-Policy is ${csp.length} chars, exceeding the ${MAX_NGINX_LINE}-char NGINX limit. ` +
      `NGINX would drop the header and serve no CSP. Trim the script-src allowlist.`,
  );
  process.exit(1);
}

// Drift guard: the committed dev/local-serve fallback (security-headers.conf)
// must carry the exact same NON-CSP headers as the generated production file.
// They used to diverge silently (a 3-directive Permissions-Policy in dev vs 13
// in prod). scripts/lib/headers.mjs is the single source for both; this catches
// any future edit that touches one file but not the other.
const SOURCE_HEADERS_FILE = join(process.cwd(), 'security-headers.conf');
const sourceHeaders = statSync(SOURCE_HEADERS_FILE, { throwIfNoEntry: false })?.isFile()
  ? readFileSync(SOURCE_HEADERS_FILE, 'utf-8')
  : '';
const generatedNonCsp = nonCspAddHeaderLines(headersText);
const sourceNonCsp = nonCspAddHeaderLines(sourceHeaders);
if (sourceNonCsp.join('\n') !== generatedNonCsp.join('\n')) {
  console.error(
    `✗ csp-audit: non-CSP security headers drifted between the generated ` +
      `dist/fluxus/security-headers.conf and the committed security-headers.conf.\n` +
      `  Both must mirror scripts/lib/headers.mjs (STATIC_SECURITY_HEADERS).`,
  );
  console.error('  generated:\n' + generatedNonCsp.map((l) => '    ' + l).join('\n'));
  console.error('  source:   \n' + sourceNonCsp.map((l) => '    ' + l).join('\n'));
  process.exit(1);
}

function directiveTokens(directive) {
  // CSP directives are `;`-separated; each starts with the directive name
  // followed by space-separated source tokens.
  const re = new RegExp(`(?:^|;)\\s*${directive}\\s+([^;]+)`, 'i');
  const m = csp.match(re);
  if (!m) return [];
  return m[1].trim().split(/\s+/);
}

const scriptSrc = directiveTokens('script-src');
if (scriptSrc.length === 0) {
  console.error(`Could not find a script-src directive in the CSP.`);
  process.exit(1);
}

const scriptSrcSet = new Set(scriptSrc);
const hasUnsafeHashes = scriptSrcSet.has("'unsafe-hashes'");

// Inline event handler attributes — anything matching `on<word>="..."`. We
// scan single- and double-quoted forms; unquoted attribute values are
// vanishingly rare in machine-emitted HTML and we can add them later if
// they ever appear in dist/.
const EVENT_HANDLER_DOUBLE = /\son[a-z]+\s*=\s*"([^"]*)"/gi;
const EVENT_HANDLER_SINGLE = /\son[a-z]+\s*=\s*'([^']*)'/gi;

const handlerMisses = [];
const scriptMisses = [];
let handlerCount = 0;
let scriptCount = 0;
const seenHandlers = new Set();
const seenScripts = new Set();

for (const file of walk(DIST_BROWSER, { filter: (name) => name.endsWith('.html') })) {
  const html = readFileSync(file, 'utf-8');
  const rel = file.slice(DIST_BROWSER.length + 1);

  for (const re of [EVENT_HANDLER_DOUBLE, EVENT_HANDLER_SINGLE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(html)) !== null) {
      const value = m[1];
      handlerCount += 1;
      const token = sha256Token(value);
      if (!hasUnsafeHashes || !scriptSrcSet.has(token)) {
        const key = `${rel}::${value}`;
        if (!seenHandlers.has(key)) {
          seenHandlers.add(key);
          handlerMisses.push({ file: rel, value, token });
        }
      }
    }
  }

  SCRIPT_TAG.lastIndex = 0;
  let m;
  while ((m = SCRIPT_TAG.exec(html)) !== null) {
    const [, attrs, body] = m;
    if (!isInlineExecutable(attrs)) continue;
    if (!body) continue;
    scriptCount += 1;
    const token = sha256Token(body);
    if (!scriptSrcSet.has(token)) {
      const key = `${rel}::${token}`;
      if (!seenScripts.has(key)) {
        seenScripts.add(key);
        scriptMisses.push({ file: rel, token, snippet: body.slice(0, 60).replace(/\s+/g, ' ') });
      }
    }
  }
}

console.log(
  `Audited ${handlerCount} inline event handler${handlerCount === 1 ? '' : 's'} and ${scriptCount} inline <script> block${scriptCount === 1 ? '' : 's'} across dist/fluxus/browser/.`,
);

let failed = false;

if (handlerMisses.length > 0) {
  failed = true;
  console.error(`\n${handlerMisses.length} inline event handler(s) NOT covered by script-src:`);
  for (const miss of handlerMisses) {
    console.error(`  - ${miss.file}`);
    console.error(`      handler value: ${miss.value}`);
    console.error(`      expected token in script-src: ${miss.token}`);
  }
  if (!hasUnsafeHashes) {
    console.error(
      `\n  Note: 'unsafe-hashes' is missing from script-src. Inline event handlers require it ` +
        `in addition to the per-handler hash.`,
    );
  }
}

if (scriptMisses.length > 0) {
  failed = true;
  console.error(`\n${scriptMisses.length} inline <script> block(s) NOT covered by script-src:`);
  for (const miss of scriptMisses) {
    console.error(`  - ${miss.file}`);
    console.error(`      expected token: ${miss.token}`);
    console.error(`      script body starts: "${miss.snippet}"`);
  }
}

if (failed) {
  console.error(
    `\nFix: regenerate dist/fluxus/security-headers.conf via scripts/build-csp.mjs, ` +
      `or add the missing token(s) to the script-src template there.`,
  );
  console.error(
    `✗ csp-audit: fail (${handlerMisses.length} handler miss${handlerMisses.length === 1 ? '' : 'es'}, ${scriptMisses.length} script miss${scriptMisses.length === 1 ? '' : 'es'})`,
  );
  process.exit(1);
}

// Greppable summary line for CI logs (`grep '✓ csp-audit'`) — the prose
// "OK — …" line above stays for human readers.
console.log(
  `OK — every inline handler and inline <script> has a matching script-src entry.\n✓ csp-audit: pass (${handlerCount} handlers, ${scriptCount} scripts)`,
);
