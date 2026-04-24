import { Injectable } from '@angular/core';
import { Marked } from 'marked';
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

  render(md: string): string {
    const html = this.marked.parse(md) as string;
    // Make every code block keyboard-scrollable. The .prose pre rule in
    // styles.css gives the block `overflow-x: auto`, which axe-core flags as
    // a non-focusable scrollable region (WCAG 2.1.1). Adding tabindex="0"
    // lets keyboard users scroll horizontally without changing visuals.
    return html.replace(/<pre>/g, '<pre tabindex="0">');
  }
}
