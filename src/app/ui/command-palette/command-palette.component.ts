import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  viewChild,
  ElementRef,
  afterNextRender,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { NavigationService } from '../../core/services/navigation.service';
import { BlogService } from '../../core/services/blog.service';

interface CommandItem {
  /** Stable id for keyboard selection / track-by. */
  id: string;
  /** What the user reads in the list. */
  label: string;
  /** Smaller secondary label (e.g. "Blog post", "Page"). */
  hint: string;
  /** Click target. */
  route: string;
  /** Icon name. */
  icon: string;
}

@Component({
  selector: 'ui-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  private router = inject(Router);
  private nav = inject(NavigationService);
  private blog = inject(BlogService);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  protected input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected open = signal(false);
  protected query = signal('');
  protected highlighted = signal(0);

  /** Catalog: every nav route + every blog post + every tag landing page. */
  private catalog = computed<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    for (const item of this.nav.sidebarItems()) {
      if (item.type === 'link') {
        items.push({
          id: `route:${item.route}`,
          label: item.label,
          hint: 'Page',
          route: item.route,
          icon: item.icon,
        });
      }
    }
    for (const post of this.blog.posts()) {
      items.push({
        id: `post:${post.slug}`,
        label: post.title,
        hint: 'Blog post',
        route: `/blog/${post.slug}`,
        icon: 'file-text',
      });
    }
    return items;
  });

  protected filtered = computed<CommandItem[]>(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.catalog();
    if (!q) return all;
    return all.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.route.toLowerCase().includes(q),
    );
  });

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      const onKey = (event: KeyboardEvent) => {
        // Cmd+K (mac) / Ctrl+K (everywhere else).
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          this.toggle();
        } else if (event.key === 'Escape' && this.open()) {
          this.close();
        }
      };
      window.addEventListener('keydown', onKey);
      this.destroyRef.onDestroy(() => window.removeEventListener('keydown', onKey));
    });
  }

  protected toggle(): void {
    if (this.open()) this.close();
    else this.openPalette();
  }

  protected openPalette(): void {
    this.open.set(true);
    this.query.set('');
    this.highlighted.set(0);
    queueMicrotask(() => {
      this.dialog()?.nativeElement.showModal?.();
      this.input()?.nativeElement.focus();
    });
  }

  protected close(): void {
    this.dialog()?.nativeElement.close?.();
    this.open.set(false);
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.highlighted.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    const items = this.filtered();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlighted.update((i) => Math.min(items.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlighted.update((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[this.highlighted()];
      if (item) this.select(item);
    }
  }

  protected select(item: CommandItem): void {
    this.close();
    this.router.navigate([item.route]);
  }
}
