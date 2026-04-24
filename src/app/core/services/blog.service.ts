import { Injectable, computed, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MarkdownService } from './markdown.service';
import { BlogPost } from '../../shared/models/blog-post.model';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private md = inject(MarkdownService);

  // Reactive resource: kicks off eagerly, exposes value/isLoading/error as
  // signals, and stays in sync with HttpClient (interceptors, transfer cache).
  private postsResource = httpResource<BlogPost[]>(() => 'assets/blog/posts.json', {
    defaultValue: [],
  });

  readonly posts = computed(() =>
    this.postsResource.hasValue() ? this.sortByDateDesc(this.postsResource.value() ?? []) : [],
  );
  readonly latestPosts = computed(() => this.posts().slice(0, 2));
  readonly loading = computed(() => this.postsResource.isLoading());
  readonly error = computed(() => (this.postsResource.error() ? 'Failed to load blog posts' : null));

  getPostContent(slug: string): Observable<string> {
    return this.http
      .get(`assets/blog/posts/${slug}.md`, { responseType: 'text' })
      .pipe(map((raw) => this.md.render(raw)));
  }

  getAdjacentPosts(slug: string): { prev?: BlogPost; next?: BlogPost } {
    const all = this.posts();
    const idx = all.findIndex((p) => p.slug === slug);
    if (idx === -1) return {};
    return {
      prev: idx > 0 ? all[idx - 1] : undefined,
      next: idx < all.length - 1 ? all[idx + 1] : undefined,
    };
  }

  private sortByDateDesc(posts: BlogPost[]): BlogPost[] {
    return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
