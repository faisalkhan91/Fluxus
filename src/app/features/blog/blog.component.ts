import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { SectionHeaderComponent } from '../../ui/section-header/section-header.component';
import { BlogService } from '../../core/services/blog.service';
import { slugify } from '../../shared/utils/string.utils';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.css',
  imports: [GlassCardComponent, IconComponent, SectionHeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent {
  protected blog = inject(BlogService);

  /** De-duplicated, alphabetised list of every tag across all posts. */
  protected allTags = computed(() => {
    const set = new Set<string>();
    for (const post of this.blog.posts()) {
      for (const tag of post.tags) set.add(tag);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  protected tagSlug(tag: string): string {
    return slugify(tag);
  }
}
