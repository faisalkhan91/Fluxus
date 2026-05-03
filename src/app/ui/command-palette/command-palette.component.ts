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
import { NavigationService } from '@core/services/navigation.service';
import { BlogService } from '@core/services/blog.service';
import { ThemeService } from '@core/services/theme.service';

/**
 * Discriminator separates plain navigation from in-place actions
 * (theme switch, theme cycle, future "copy URL" / "view JSON" entries).
 * Keeping the kind explicit means `select()` can't accidentally
 * `router.navigate(undefined)` for an action item.
 */
type CommandKind = 'route' | 'action';

interface CommandItem {
  /** Stable id for keyboard selection / track-by (e.g. `route:/about`). */
  id: string;
  /**
   * DOM-safe variant of `id` used as the `id` attribute on the option
   * `<button>` and as the `aria-activedescendant` target on the input.
   * `id` itself contains characters (`:` `/`) that survive HTML5 but are
   * brittle in CSS selectors / getElementById queries; this strips them.
   */
  domId: string;
  /** What the user reads in the list. */
  label: string;
  /** Smaller secondary label (e.g. "Blog post", "Page", "Theme · Dark"). */
  hint: string;
  /** Icon name. */
  icon: string;
  /** Determines which arm of `select()` runs for this item. */
  kind: CommandKind;
  /** Click target — only meaningful when `kind === 'route'`. */
  route?: string;
  /** Side effect — only meaningful when `kind === 'action'`. */
  run?: () => void;
  /**
   * Optional accent dot rendered ahead of the icon. Used by theme entries
   * to preview the active accent for each theme without enumerating yet
   * another icon per theme.
   */
  swatch?: string;
}

/**
 * Map a logical item id (`route:/about`, `post:my-slug`) to an HTML id
 * suitable for `aria-activedescendant`. Replaces any non-`[A-Za-z0-9_-]`
 * character with a single dash so the result clears CSS selector rules
 * and the SR announces an unambiguous reference target.
 */
function toDomId(id: string): string {
  return 'palette-option-' + id.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
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
  private theme = inject(ThemeService);
  private destroyRef = inject(DestroyRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  protected input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected open = signal(false);
  protected query = signal('');
  protected highlighted = signal(0);

  /** Catalog: every nav route + every blog post + every theme action. */
  private catalog = computed<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    for (const item of this.nav.sidebarItems) {
      if (item.type === 'link') {
        const id = `route:${item.route}`;
        items.push({
          id,
          domId: toDomId(id),
          label: item.label,
          hint: 'Page',
          icon: item.icon,
          kind: 'route',
          route: item.route,
        });
      }
    }
    for (const post of this.blog.posts()) {
      const id = `post:${post.slug}`;
      items.push({
        id,
        domId: toDomId(id),
        label: post.title,
        hint: 'Blog post',
        icon: 'file-text',
        kind: 'route',
        route: `/blog/${post.slug}`,
      });
    }
    for (const def of this.theme.registry) {
      const id = `theme:${def.id}`;
      items.push({
        id,
        domId: toDomId(id),
        label: `Switch theme: ${def.label}`,
        hint: def.scheme === 'dark' ? 'Theme · Dark' : 'Theme · Light',
        icon: 'palette',
        kind: 'action',
        run: () => this.theme.setTheme(def.id),
        swatch: def.swatch,
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
        item.label.toLowerCase().includes(q) ||
        (item.route?.toLowerCase().includes(q) ?? false) ||
        item.id.toLowerCase().includes(q),
    );
  });

  /**
   * DOM id of the currently-highlighted option, or `null` when the list is
   * empty. The input element binds this to `aria-activedescendant` so screen
   * readers announce arrow-key movement inside the listbox even though
   * keyboard focus stays on the input. WAI-ARIA combobox/listbox pattern.
   */
  protected activeDescendantId = computed<string | null>(() => {
    const list = this.filtered();
    if (list.length === 0) return null;
    const item = list[Math.min(this.highlighted(), list.length - 1)];
    return item?.domId ?? null;
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

  /**
   * Opens the palette pre-filtered to a query string. Used by the
   * sidebar / mobile FAB to surface theme actions in one keystroke.
   */
  openWith(initialQuery: string): void {
    this.open.set(true);
    this.query.set(initialQuery);
    this.highlighted.set(0);
    queueMicrotask(() => {
      this.dialog()?.nativeElement.showModal?.();
      const el = this.input()?.nativeElement;
      if (el) {
        el.focus();
        // Place the caret at the end so the user can keep typing to
        // narrow the list further (e.g. `theme:tokyo`).
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
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
    if (item.kind === 'action') {
      item.run?.();
      return;
    }
    if (item.route) this.router.navigate([item.route]);
  }
}
