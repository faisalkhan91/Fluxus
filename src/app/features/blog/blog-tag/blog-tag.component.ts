import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GlassCardComponent } from '../../../ui/glass-card/glass-card.component';
import { IconComponent } from '../../../ui/icon/icon.component';
import { SectionHeaderComponent } from '../../../ui/section-header/section-header.component';
import { BlogService } from '../../../core/services/blog.service';
import { slugify } from '../../../shared/utils/string.utils';
import { formatPostDate } from '../../../shared/utils/blog.utils';

@Component({
  selector: 'app-blog-tag',
  templateUrl: './blog-tag.component.html',
  styleUrl: './blog-tag.component.css',
  imports: [GlassCardComponent, IconComponent, SectionHeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogTagComponent {
  private route = inject(ActivatedRoute);
  protected blog = inject(BlogService);

  protected tagSlug = toSignal(
    this.route.paramMap.pipe(map((p) => (p.get('tag') ?? '').toLowerCase())),
    { initialValue: '' },
  );

  /**
   * The displayable tag name = whatever capitalisation the first matching post
   * uses, falling back to the slug. We compare on slugified tags so URLs like
   * `/blog/tag/ci-cd` match either `CI/CD` or `ci/cd` in the manifest.
   */
  readonly tagLabel = computed(() => {
    const slug = this.tagSlug();
    if (!slug) return '';
    for (const post of this.blog.posts()) {
      const match = post.tags.find((t) => slugify(t) === slug);
      if (match) return match;
    }
    return slug;
  });

  readonly matchingPosts = computed(() => {
    const slug = this.tagSlug();
    if (!slug) return [];
    return this.blog.posts().filter((p) => p.tags.some((t) => slugify(t) === slug));
  });

  protected formatDate(iso: string): string {
    return formatPostDate(iso);
  }
}
