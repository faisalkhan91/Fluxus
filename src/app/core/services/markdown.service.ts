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
    return (
      `<aside class="callout callout--${t.kind}" role="note">` +
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
        const id = slugify(text.trim());
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
          // aria-live=polite so the swap to "Copied!" is announced; the
          // delegated click handler in BlogPostComponent does the work.
          `<button type="button" class="copy-btn" aria-live="polite" aria-label="Copy code to clipboard">Copy</button>` +
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
        const img = `<img src="${escapeAttr(
          href,
        )}"${altAttr}${titleAttr}${dimAttrs} loading="lazy" decoding="async" />`;
        if (!altText) return img;
        return `<figure>${img}<figcaption>${escapeHtml(altText)}</figcaption></figure>`;
      },
    };

    this.marked.use({ renderer, extensions: [calloutExtension] });
  }

  render(md: string): string {
    this.currentToc = [];
    return this.marked.parse(md) as string;
  }

  /**
   * Same as `render()` but also returns a flattened table of contents built
   * from h2 + h3 headings encountered during the parse. Consumers (the blog
   * post page) decide whether to display it based on length / viewport.
   */
  renderWithToc(md: string): { html: string; toc: TocEntry[] } {
    this.currentToc = [];
    const html = this.marked.parse(md) as string;
    return { html, toc: [...this.currentToc] };
  }
}
