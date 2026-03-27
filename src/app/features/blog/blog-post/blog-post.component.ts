import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, switchMap, takeUntil } from 'rxjs';
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
export class BlogPostComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  private blog = inject(BlogService);

  readonly content = signal<SafeHtml>('');
  readonly meta = signal<BlogPost | undefined>(undefined);
  readonly loading = signal(true);

  private destroy$ = new Subject<void>();

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
        takeUntil(this.destroy$),
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
