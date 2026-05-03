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
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_HTML = join(process.cwd(), 'dist/fluxus/browser');
const HEADERS_FILE = join(process.cwd(), 'dist/fluxus/security-headers.conf');

if (!statSync(DIST_HTML, { throwIfNoEntry: false })?.isDirectory()) {
  console.error(`dist/fluxus/browser/ does not exist — run \`ng build\` first.`);
  process.exit(1);
}
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

function* walkHtml(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walkHtml(full);
    else if (name.endsWith('.html')) yield full;
  }
}

function sha256Token(value) {
  const digest = createHash('sha256').update(value, 'utf-8').digest('base64');
  return `'sha256-${digest}'`;
}

// Inline event handler attributes — anything matching `on<word>="..."`. We
// scan single- and double-quoted forms; unquoted attribute values are
// vanishingly rare in machine-emitted HTML and we can add them later if
// they ever appear in dist/.
const EVENT_HANDLER_DOUBLE = /\son[a-z]+\s*=\s*"([^"]*)"/gi;
const EVENT_HANDLER_SINGLE = /\son[a-z]+\s*=\s*'([^']*)'/gi;
const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

function isInlineScriptAttrs(attrs) {
  return !/\bsrc\s*=/i.test(attrs);
}

const handlerMisses = [];
const scriptMisses = [];
let handlerCount = 0;
let scriptCount = 0;
const seenHandlers = new Set();
const seenScripts = new Set();

for (const file of walkHtml(DIST_HTML)) {
  const html = readFileSync(file, 'utf-8');
  const rel = file.slice(DIST_HTML.length + 1);

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
    if (!isInlineScriptAttrs(attrs)) continue;
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
  process.exit(1);
}

console.log(`OK — every inline handler and inline <script> has a matching script-src entry.`);
