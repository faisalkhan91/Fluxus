import { Component, booleanAttribute, computed, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { TagComponent, type TagSize } from '@ui/tag/tag.component';
import type { BlogPost } from '@shared/models/blog-post.model';
import { formatPostDate } from '@shared/utils/blog.utils';

/**
 * Post card shared by the blog index and the tag archive. Owns the whole
 * card — the `.post-link` anchor, the GlassCard, and the cover/thumb/sigil
 * + body markup — so the featured/hover styles (which reach across the
 * anchor into the card content) stay inside one encapsulation boundary.
 *
 * Surface differences are inputs rather than separate templates:
 *  - `featured`  — blog index's newest post: full-width hero with a side
 *    cover instead of the 1:1 thumbnail. Always false on the tag archive.
 *  - `clampText` — clamp title/excerpt to fixed line counts so a grid row
 *    of `grid-auto-rows: 1fr` cards stays balanced (blog index). The tag
 *    archive lets cards size to content, so it leaves this off.
 *  - `tagSize`   — `sm` pills on the index, `md` on the archive.
 *  - `enterDelayStep` — per-card stagger in ms (index 30, archive 50).
 *
 * Entrance is CSS `@starting-style` (see post-card.component.css) for both
 * surfaces — it avoids the one-frame Firefox flash that `animate.enter`
 * shows on client-side navigation.
 */
@Component({
  selector: 'app-post-card',
  imports: [GlassCardComponent, IconComponent, TagComponent, NgOptimizedImage, RouterLink],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css',
  host: {
    '[class.featured]': 'featured()',
    '[class.clamp]': 'clampText()',
    '[style.--enter-delay]': 'enterDelay()',
  },
})
export class PostCardComponent {
  readonly post = input.required<BlogPost>();
  /** Decorated cover URL for the featured hero (falls back to the sigil). */
  readonly cover = input('');
  readonly featured = input(false, { transform: booleanAttribute });
  readonly clampText = input(false, { transform: booleanAttribute });
  readonly tagSize = input<TagSize>('sm');
  /** Card position in the grid; drives the staggered entrance delay. */
  readonly index = input(0);
  /** Per-card stagger increment in ms. */
  readonly enterDelayStep = input(30);

  protected readonly enterDelay = computed(() => `${this.index() * this.enterDelayStep()}ms`);

  protected formatDate(date: string): string {
    return formatPostDate(date);
  }
}
