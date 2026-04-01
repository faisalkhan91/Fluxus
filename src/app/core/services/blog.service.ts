import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
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
import { BlogPost } from '../../shared/models/blog-post.model';

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

const marked = new Marked(
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

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);

  readonly posts = signal<BlogPost[]>([]);

  readonly latestPosts = computed(() =>
    [...this.posts()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2),
  );

  private manifest$: Observable<BlogPost[]> | undefined;

  loadPosts(): void {
    if (this.manifest$) return;

    this.manifest$ = this.http
      .get<BlogPost[]>('assets/blog/posts.json')
      .pipe(shareReplay(1));

    this.manifest$.subscribe(posts => this.posts.set(posts));
  }

  getPostContent(slug: string): Observable<string> {
    return this.http
      .get(`assets/blog/posts/${slug}.md`, { responseType: 'text' })
      .pipe(map(md => marked.parse(md) as string));
  }

  getPostMeta(slug: string): BlogPost | undefined {
    return this.posts().find(p => p.slug === slug);
  }

  getAdjacentPosts(slug: string): { prev?: BlogPost; next?: BlogPost } {
    const all = this.posts();
    const idx = all.findIndex(p => p.slug === slug);
    return {
      prev: idx > 0 ? all[idx - 1] : undefined,
      next: idx < all.length - 1 ? all[idx + 1] : undefined,
    };
  }
}
