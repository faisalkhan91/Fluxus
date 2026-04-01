import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlassPanelComponent } from '../../../ui/glass-panel/glass-panel.component';
import { IconComponent } from '../../../ui/icon/icon.component';
import { BlogService } from '../../../core/services/blog.service';
import { BlogPost } from '../../../shared/models/blog-post.model';

@Component({
  selector: 'app-blog-post',
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.css',
  imports: [GlassPanelComponent, IconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private blog = inject(BlogService);
  private destroyRef = inject(DestroyRef);
  private elRef = inject(ElementRef);

  readonly content = signal<SafeHtml>('');
  readonly meta = signal<BlogPost | undefined>(undefined);
  readonly loading = signal(true);
  readonly scrollProgress = signal(0);

  readonly adjacentPosts = computed(() => {
    const post = this.meta();
    return post ? this.blog.getAdjacentPosts(post.slug) : { prev: undefined, next: undefined };
  });

  constructor() {
    afterNextRender(() => {
      const postLayout = this.elRef.nativeElement.querySelector('.post-layout') as HTMLElement | null;
      if (!postLayout) return;

      const onScroll = () => {
        const rect = postLayout.getBoundingClientRect();
        const total = postLayout.offsetHeight - window.innerHeight;
        if (total <= 0) { this.scrollProgress.set(100); return; }
        const scrolled = Math.max(0, -rect.top);
        this.scrollProgress.set(Math.min(100, (scrolled / total) * 100));
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }

  ngOnInit(): void {
    this.blog.loadPosts();

    this.route.paramMap
      .pipe(
        switchMap(params => {
          const slug = params.get('slug') ?? '';
          this.meta.set(this.blog.getPostMeta(slug));
          this.loading.set(true);
          return this.blog.getPostContent(slug);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: html => {
          this.content.set(this.sanitizer.bypassSecurityTrustHtml(html));
          this.loading.set(false);
          if (!this.meta()) {
            const slug = this.route.snapshot.paramMap.get('slug') ?? '';
            this.meta.set(this.blog.getPostMeta(slug));
          }
        },
        error: () => this.loading.set(false),
      });
  }
}
