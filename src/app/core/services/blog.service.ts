import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, catchError, of } from 'rxjs';
import { MarkdownService } from './markdown.service';
import { BlogPost } from '../../shared/models/blog-post.model';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private md = inject(MarkdownService);

  readonly posts = signal<BlogPost[]>([]);
  readonly error = signal<string | null>(null);

  readonly latestPosts = computed(() =>
    [...this.posts()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2),
  );

  private manifest$: Observable<BlogPost[]> | undefined;

  loadPosts(): Observable<BlogPost[]> {
    if (!this.manifest$) {
      this.manifest$ = this.http.get<BlogPost[]>('assets/blog/posts.json').pipe(
        catchError(() => {
          this.error.set('Failed to load blog posts');
          return of([]);
        }),
        shareReplay(1),
      );

      this.manifest$.subscribe((posts) => this.posts.set(posts));
    }
    return this.manifest$;
  }

  getPostContent(slug: string): Observable<string> {
    return this.http
      .get(`assets/blog/posts/${slug}.md`, { responseType: 'text' })
      .pipe(map((raw) => this.md.render(raw)));
  }

  getAdjacentPosts(slug: string): { prev?: BlogPost; next?: BlogPost } {
    const all = this.posts();
    const idx = all.findIndex((p) => p.slug === slug);
    return {
      prev: idx > 0 ? all[idx - 1] : undefined,
      next: idx < all.length - 1 ? all[idx + 1] : undefined,
    };
  }
}
