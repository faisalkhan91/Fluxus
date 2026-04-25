import { Injectable } from '@angular/core';
import { Marked, type Renderer } from 'marked';
import { markedHighlight } from 'marked-highlight';
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
import { slugify } from '../../shared/utils/string.utils';

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

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private readonly marked = new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return code;
      },
    }),
  );

  constructor() {
    const renderer: Partial<Renderer> = {
      // Heading: emit a stable slugified `id` so external hash links
      // (`/blog/foo#some-section`) scroll into place. We deliberately omit
      // a visible permalink anchor — the `<base href="/">` in index.html
      // would otherwise resolve `href="#x"` clicks to `/#x` and bounce
      // visitors back to the home route.
      heading: ({ text, depth }) => {
        const id = slugify(text.trim());
        const inline = this.marked.parseInline(text) as string;
        return `<h${depth} id="${escapeAttr(id)}">${inline}</h${depth}>\n`;
      },

      // Code blocks: keep the existing tabindex/highlight pipeline and add a
      // copy button. The button has no inline JS — BlogPostComponent wires a
      // single delegated listener via afterNextRender.
      code: ({ text, lang }) => {
        const langKey = lang?.trim().split(/\s+/)[0] ?? '';
        const highlighted =
          langKey && hljs.getLanguage(langKey)
            ? hljs.highlight(text, { language: langKey }).value
            : escapeHtml(text);
        const langClass = langKey ? ` language-${escapeAttr(langKey)}` : '';
        return (
          `<pre tabindex="0">` +
          `<button type="button" class="copy-btn" aria-label="Copy code to clipboard">Copy</button>` +
          `<code class="hljs${langClass}">${highlighted}</code>` +
          `</pre>\n`
        );
      },

      // Images: always add loading="lazy" + decoding="async" (helps LCP),
      // and inject intrinsic width/height when known (prevents CLS).
      image: ({ href, title, text }) => {
        const dim = lookupDims(href);
        const dimAttrs = dim ? ` width="${dim.w}" height="${dim.h}"` : '';
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
        const altAttr = ` alt="${escapeAttr(text ?? '')}"`;
        return `<img src="${escapeAttr(
          href,
        )}"${altAttr}${titleAttr}${dimAttrs} loading="lazy" decoding="async" />`;
      },
    };

    this.marked.use({ renderer });
  }

  render(md: string): string {
    return this.marked.parse(md) as string;
  }
}
