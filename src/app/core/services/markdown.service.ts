import { Injectable } from '@angular/core';
import { Marked, type Renderer, type Tokens, type TokenizerAndRendererExtension } from 'marked';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import json from 'highlight.js/lib/languages/json';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import { IMAGE_DIMS } from './image-dims.generated';
import { IMAGE_VARIANTS } from '../image/image-variants.generated';
import { slugify } from '@shared/utils/string.utils';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('markdown', markdown);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

/**
 * Strip dangerous URL schemes from a markdown link href.
 *
 * `marked` does not sanitise href values — `[click](javascript:alert(1))`
 * passes through verbatim. We bypass Angular's DOM sanitiser when
 * rendering (`bypassSecurityTrustHtml` in the trusted-html pipe) because
 * post markdown is author-controlled local content; this guard is the
 * defence-in-depth check that keeps a future copy-paste mistake or a
 * compromised commit from yielding a `javascript:` link that executes
 * in the site origin.
 *
 * Allowed: `http(s):`, `mailto:`, `tel:`, fragment links (`#...`),
 * relative paths (no scheme). Anything else (including `data:`, `vbscript:`,
 * `file:`, and the `javascript:` case) collapses to `#` so the link still
 * renders but does nothing on click.
 */
/**
 * Decode the HTML character references a browser would resolve while
 * parsing an attribute value, so the scheme test below sees what the
 * browser will actually execute — not the obfuscated source spelling.
 * Covers numeric (`&#106;`), hex (`&#x6a;`), and the named references
 * that decode to scheme-relevant characters (`&colon;` → `:`,
 * `&Tab;`/`&NewLine;` → control chars). marked emits link hrefs verbatim
 * (no `&`-escaping in its default link renderer), so without this an
 * attacker can spell `javascript:` as `&#106;avascript:` or
 * `java&#09;script:` and slip past a literal-letter scheme regex.
 */
function decodeCharRefs(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => safeFromCodePoint(parseInt(dec, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&(?:tab|newline);/gi, ' ');
}

function safeFromCodePoint(code: number): string {
  return Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
}

function sanitizeLinkHref(href: string | null | undefined): string {
  const raw = (href ?? '').trim();
  if (!raw) return '#';
  // Normalise the way a browser does before resolving the scheme: decode
  // character references and strip ASCII control chars (TAB/NL inside a
  // scheme are ignored by URL parsers). The scheme test runs on this
  // normalised form so `&#106;avascript:` / `java&#09;script:` / fully
  // entity-encoded `javascript:` collapse to `#` instead of being waved
  // through as "relative references".
  // Strip all whitespace + ASCII control chars from the scheme-check
  // form (a real URL scheme contains none; URL parsers ignore embedded
  // TAB/NL). Only the safety decision uses `normalized`; the emitted
  // href is always `raw`.
  // eslint-disable-next-line no-control-regex -- intentional: stripping ASCII control chars is the point (browsers ignore TAB/NL inside a URL scheme).
  const normalized = decodeCharRefs(raw).replace(/[\s\u0000-\u001F\u007F]+/g, '');
  if (
    normalized.startsWith('#') ||
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../')
  ) {
    return raw;
  }
  // Detect a leading scheme on the normalised form; if present and not
  // allowed, neutralise.
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(normalized);
  if (!schemeMatch) return raw; // no scheme → relative reference
  const scheme = schemeMatch[1].toLowerCase();
  if (scheme === 'http' || scheme === 'https' || scheme === 'mailto' || scheme === 'tel') {
    return raw;
  }
  return '#';
}

/**
 * Looks up the intrinsic dimensions for an image referenced from markdown.
 * The map is generated from on-disk assets by `scripts/build-image-dims.mjs`.
 *
 * Knows about three URL shapes that show up in posts:
 *   - `assets/images/blog/foo.webp`            (recommended, exact key)
 *   - `/assets/images/blog/foo.webp`           (root-relative)
 *   - `https://faisalkhan.dpdns.org/assets/…`  (absolute, ignored)
 */
function lookupDims(href: string): { w: number; h: number } | undefined {
  if (!href) return undefined;
  if (/^https?:/i.test(href)) return undefined;
  const trimmed = href.replace(/^\.?\/?/, '');
  return IMAGE_DIMS[trimmed];
}

/**
 * Builds a width-descriptor `srcset` for an inline markdown image that has
 * pre-generated WebP variants (scripts/build-image-variants.mjs). Inline
 * prose images render as plain `<img>` (not NgOptimizedImage), so the
 * IMAGE_LOADER never sees them — we emit the responsive srcset here instead.
 * Variant URLs preserve whatever path prefix the author used; the original
 * is appended at its intrinsic width so large viewports still get full res.
 * Returns '' when the image has no variants.
 */
function buildSrcset(href: string, dim: { w: number; h: number } | undefined): string {
  if (!href || /^https?:/i.test(href)) return '';
  const key = href.replace(/^\.?\/?/, '');
  const widths = IMAGE_VARIANTS[key];
  if (!widths || widths.length === 0) return '';
  const dot = href.lastIndexOf('.');
  if (dot < 0) return '';
  const base = href.slice(0, dot);
  const ext = href.slice(dot);
  const entries = widths.map((w) => `${escapeAttr(`${base}-${w}w${ext}`)} ${w}w`);
  if (dim?.w) entries.push(`${escapeAttr(href)} ${dim.w}w`);
  return entries.join(', ');
}

/**
 * GitHub-style callout admonition extension for marked.
 *
 * Source markdown:
 *   > [!WARNING] The SMR Trap
 *   > The market is currently saturated...
 *
 * Renders to:
 *   <aside class="callout callout--warning" role="note">
 *     <p class="callout-title">The SMR Trap</p>
 *     <p>The market is currently saturated...</p>
 *   </aside>
 *
 * Supported kinds: NOTE | TIP | INFO | WARNING | CAUTION (case-insensitive).
 * Title text is optional; defaults to the kind label when omitted.
 */
type CalloutKind = 'note' | 'tip' | 'info' | 'warning' | 'caution';
const CALLOUT_LABELS: Record<CalloutKind, string> = {
  note: 'Note',
  tip: 'Tip',
  info: 'Info',
  warning: 'Warning',
  caution: 'Caution',
};

const calloutExtension: TokenizerAndRendererExtension = {
  name: 'callout',
  level: 'block',
  start(src: string) {
    const m = src.match(/^>\s*\[!/m);
    return m?.index;
  },
  tokenizer(src: string) {
    const rule = /^>\s*\[!(NOTE|TIP|INFO|WARNING|CAUTION)\][ \t]*([^\n]*)\n((?:>[^\n]*\n?)*)/i;
    const match = rule.exec(src);
    if (!match) return undefined;
    const [raw, kindRaw, title, bodyLines] = match;
    const kind = kindRaw.toLowerCase() as CalloutKind;
    const body = bodyLines.replace(/^>\s?/gm, '').trim();
    return {
      type: 'callout',
      raw,
      kind,
      title: title.trim(),
      tokens: this.lexer.blockTokens(body || '', []),
    };
  },
  renderer(token) {
    const t = token as Tokens.Generic & {
      kind: CalloutKind;
      title: string;
      tokens: Tokens.Generic[];
    };
    const body = this.parser.parse(t.tokens);
    const titleText = t.title || CALLOUT_LABELS[t.kind];
    // WARNING and CAUTION get `role="region"` + an explicit
    // `aria-label="Warning"` / `"Caution"` so they surface as
    // distinct landmarks in AT region-navigation and the SR
    // announces the urgency kind alongside any custom title.
    // NOTE / TIP / INFO stay on `role="note"` — supplemental,
    // non-urgent prose blocks belong with note semantics rather
    // than landmark-noise polluting longer posts. `role="alert"`
    // is rejected for both: it's for *dynamic* changes and would
    // force the SR to interrupt the read on page load.
    const isUrgent = t.kind === 'warning' || t.kind === 'caution';
    const role = isUrgent ? 'region' : 'note';
    const ariaLabel = isUrgent ? ` aria-label="${escapeAttr(CALLOUT_LABELS[t.kind])}"` : '';
    return (
      `<aside class="callout callout--${t.kind}" role="${role}"${ariaLabel}>` +
      `<p class="callout-title">${escapeHtml(titleText)}</p>` +
      `${body}` +
      `</aside>\n`
    );
  },
};

/** A flattened entry for the auto-generated table of contents. */
export interface TocEntry {
  /** Slugified heading text — matches the `id` attribute on the `<h2>`/`<h3>`. */
  id: string;
  /** Plain-text heading content (HTML stripped). */
  text: string;
  /** Heading depth (2 or 3). h1 is excluded — the post body has only one. */
  depth: 2 | 3;
}

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  // Single Marked instance with no `markedHighlight` plugin — the custom `code`
  // renderer below is the sole owner of highlighting + the copy button + the
  // mermaid placeholder. An earlier version paired both layers, which caused
  // the `markedHighlight` HTML to flow back into the custom renderer and get
  // double-encoded (rendering raw `<span class="hljs-keyword">` markup as text).
  private readonly marked = new Marked();

  /**
   * Headings collected during the most recent `render()` / `renderWithToc()`
   * call. Mutated by the heading renderer override and snapshotted by
   * `renderWithToc()` so consumers get a stable view.
   */
  private currentToc: TocEntry[] = [];

  /**
   * Per-render count of each base heading slug, so duplicate heading text
   * gets unique ids (`overview`, `overview-1`, `overview-2`). Without this,
   * two `## Overview` headings emit the same `id`/`data-anchor-id`, and a
   * deep link or TOC click to the second one resolves to the first —
   * leaving that section unreachable by anchor. Reset alongside
   * `currentToc` at the start of every render.
   */
  private slugCounts = new Map<string, number>();

  constructor() {
    const renderer: Partial<Renderer> = {
      // Heading: emit a stable slugified `id` so external hash links
      // (`/blog/foo#some-section`) scroll into place, plus a visible
      // permalink anchor so a reader who lands on a section can copy a
      // direct link without hunting for the URL bar.
      //
      // The anchor's `href` is intentionally a bare fragment (`#id`).
      // `<base href="/">` would otherwise resolve a click to `/#id` and
      // bounce the reader to the home route, so `BlogPostComponent`
      // rewrites every `[data-anchor-id]` href to the post's absolute
      // URL after the markdown renders, and intercepts clicks to update
      // the address bar via `history.replaceState` without triggering a
      // full route navigation. The `data-anchor-id` attribute is the
      // stable hook the component looks for.
      //
      // Only h2/h3 get the permalink treatment — h1 is the post title
      // (one per page, already addressable by the canonical URL) and
      // h4+ rarely warrants its own shareable anchor.
      heading: ({ text, depth }) => {
        const base = slugify(text.trim());
        // De-duplicate: first occurrence keeps the bare slug, repeats get
        // a numeric suffix so every section is independently addressable.
        const seen = this.slugCounts.get(base) ?? 0;
        this.slugCounts.set(base, seen + 1);
        const id = seen === 0 ? base : `${base}-${seen}`;
        const inline = this.marked.parseInline(text) as string;
        if (depth === 2 || depth === 3) {
          this.currentToc.push({ id, text: text.trim(), depth });
        }
        const showPermalink = depth === 2 || depth === 3;
        // The visible affordance is a small chain-link icon (Lucide-style)
        // sized independently of the heading text so it reads as a subtle
        // hover cue rather than a literal `#` glyph competing with the
        // heading. Color is driven by `currentColor` so the existing
        // `.prose .anchor` rule controls hover/focus state.
        const anchor = showPermalink
          ? `<a class="anchor" href="#${escapeAttr(id)}" data-anchor-id="${escapeAttr(id)}" aria-label="Permalink to ${escapeAttr(text.trim())}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg></a>`
          : '';
        return `<h${depth} id="${escapeAttr(id)}">${anchor}${inline}</h${depth}>\n`;
      },

      // Code blocks: keep the existing tabindex/highlight pipeline and add a
      // copy button. The button has no inline JS — BlogPostComponent wires a
      // single delegated listener via afterNextRender.
      //
      // Special-case ```mermaid fences: emit a placeholder that
      // BlogPostComponent rehydrates by lazy-importing the mermaid lib. The
      // raw source stays inline so the prerendered HTML is still useful for
      // crawlers and the "no JS" view.
      code: ({ text, lang }) => {
        const langKey = lang?.trim().split(/\s+/)[0] ?? '';
        if (langKey === 'mermaid') {
          return `<pre class="mermaid-source" data-mermaid-source>${escapeHtml(text)}</pre>\n`;
        }
        const highlighted =
          langKey && hljs.getLanguage(langKey)
            ? hljs.highlight(text, { language: langKey }).value
            : escapeHtml(text);
        const langClass = langKey ? ` language-${escapeAttr(langKey)}` : '';
        return (
          `<pre tabindex="0">` +
          // The button label lives in an inner `<span class="copy-btn-
          // label" aria-live="polite">`. Putting `aria-live` on the
          // button itself would leave some screen readers (notably
          // iOS VoiceOver) silently dropping the announcement —
          // `aria-live` traditionally applies to a container that
          // existed in the DOM *before* the mutation, and the button
          // mutating its own attribute is a non-standard shape. The
          // delegated click handler in BlogPostComponent toggles only
          // the span's textContent so the announcement reliably fires.
          `<button type="button" class="copy-btn" aria-label="Copy code to clipboard"><span class="copy-btn-label" aria-live="polite">Copy</span></button>` +
          `<code class="hljs${langClass}">${highlighted}</code>` +
          `</pre>\n`
        );
      },

      // Images: always add loading="lazy" + decoding="async" (helps LCP) and
      // inject intrinsic width/height when known (prevents CLS). Wrap in a
      // <figure> with the alt text as <figcaption> so the caption renders
      // visibly under the image — alt text alone is invisible to sighted
      // users, which loses the author's intended caption context.
      image: ({ href, title, text }) => {
        const dim = lookupDims(href);
        const dimAttrs = dim ? ` width="${dim.w}" height="${dim.h}"` : '';
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
        const altText = (text ?? '').trim();
        const altAttr = ` alt="${escapeAttr(altText)}"`;
        // Responsive srcset for images with pre-generated variants. `sizes`
        // matches the prose column: full width on mobile, ~720px max on
        // desktop (the .prose measure).
        const srcset = buildSrcset(href, dim);
        const responsiveAttrs = srcset
          ? ` srcset="${srcset}" sizes="(max-width: 768px) 94vw, 720px"`
          : '';
        const img = `<img src="${escapeAttr(
          href,
        )}"${altAttr}${titleAttr}${dimAttrs}${responsiveAttrs} loading="lazy" decoding="async" />`;
        if (!altText) return img;
        return `<figure>${img}<figcaption>${escapeHtml(altText)}</figcaption></figure>`;
      },

      // Raw inline/block HTML in a post is escaped, not emitted verbatim.
      // marked's default `html` renderer passes author HTML through untouched,
      // and the rendered string is handed to `bypassSecurityTrustHtml` — so a
      // raw `<iframe>`, `<object>`, scheme-laden `<a>`, or `<form>` would skip
      // every other guard in this file. The strict CSP already blocks inline
      // script, but escape-and-show closes the passthrough at the source
      // (same threat model as the link-scheme guard below: a future
      // copy-paste mistake or a compromised commit). Posts that need real
      // markup use markdown syntax, fenced code, or the callout extension —
      // none of which produce `html` tokens.
      html: ({ text }) => escapeHtml(text),
    };

    this.marked.use({
      renderer,
      extensions: [calloutExtension],
      // Sanitise link hrefs before the default renderer emits the <a>.
      // marked passes hrefs through verbatim — `[click](javascript:alert(1))`
      // would otherwise become `<a href="javascript:…">` and survive the
      // trust-bypass we use to inject post HTML. The site CSP blocks
      // injected `<script>` tags but not `javascript:` URI clicks, so
      // this is the necessary belt-and-braces guard alongside the bypass.
      // Allowed schemes: http(s), mailto, tel. Fragments and relative refs
      // pass through. Everything else (`javascript:`, `data:`, `vbscript:`,
      // `file:`, …) collapses to `#` so the link still renders but does
      // nothing on click.
      walkTokens(token) {
        // Images get the same scheme allowlist as links — marked's default
        // image renderer cleans the URL, but our custom `image` override
        // doesn't, so a `data:`/`javascript:` image src would otherwise pass
        // through. Running it here (before the renderer reads `href`) keeps
        // the link and image paths symmetric; legitimate http(s)/relative
        // srcs are returned unchanged so lookupDims/buildSrcset still match.
        if (token.type === 'link' || token.type === 'image') {
          const t = token as Tokens.Link | Tokens.Image;
          t.href = sanitizeLinkHref(t.href);
        }
      },
    });
  }

  render(md: string): string {
    this.currentToc = [];
    this.slugCounts.clear();
    return this.parseSafely(md);
  }

  /**
   * Same as `render()` but also returns a flattened table of contents built
   * from h2 + h3 headings encountered during the parse. Consumers (the blog
   * post page) decide whether to display it based on length / viewport.
   */
  renderWithToc(md: string): { html: string; toc: TocEntry[] } {
    this.currentToc = [];
    this.slugCounts.clear();
    const html = this.parseSafely(md);
    return { html, toc: [...this.currentToc] };
  }

  /**
   * Wraps `marked.parse(md)` so a parser exception doesn't bubble up and
   * leave the post page blank. Without the guard, an unexpected token in
   * a post (or a future marked / extension regression) would throw out
   * of the consumer's `computed()` and skip the component's error
   * branch — the user sees a blank frame with only a console error.
   * Returning a small fallback HTML keeps the post route in its `ready`
   * view-state while making the failure visible to the reader.
   */
  private parseSafely(md: string): string {
    try {
      return this.marked.parse(md) as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown parser error';
      return (
        `<aside class="callout callout--warning" role="note">` +
        `<p class="callout-title">Could not render this post</p>` +
        `<p>The Markdown parser failed: ${escapeHtml(message)}.</p>` +
        `</aside>`
      );
    }
  }
}
