import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApplicationRef, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';
import { NavigationService } from '@core/services/navigation.service';
import { BlogService } from '@core/services/blog.service';
import { ThemeService } from '@core/services/theme.service';
import { THEME_REGISTRY, getThemeDef, type ThemeId } from '@core/services/theme.registry';
import { BlogPost } from '@shared/models/blog-post.model';

const SIDEBAR = [
  {
    type: 'link' as const,
    label: 'About',
    ext: '.ts',
    route: '/about',
    icon: 'user',
  },
  {
    type: 'link' as const,
    label: 'Projects',
    ext: '.ts',
    route: '/projects',
    icon: 'folder',
  },
];

const POSTS = signal<BlogPost[]>([
  {
    slug: 'angular-21',
    title: 'Angular 21 Signals',
    date: '2025-01-01',
    excerpt: '',
    tags: [],
    readingTime: '3 min',
  },
  {
    slug: 'go-tour',
    title: 'A Go Tour',
    date: '2025-02-01',
    excerpt: '',
    tags: [],
    readingTime: '2 min',
  },
]);

/**
 * Mock ThemeService — the palette only needs `registry` (to enumerate
 * theme entries in the catalog) and `setTheme` (to fire on Enter).
 */
const themeSignal = signal<ThemeId>('crimson-dark');
const setThemeSpy = vi.fn();
const mockThemeService = {
  registry: THEME_REGISTRY,
  theme: themeSignal,
  themeDef: computed(() => getThemeDef(themeSignal())),
  scheme: computed(() => getThemeDef(themeSignal()).scheme),
  isDark: computed(() => getThemeDef(themeSignal()).scheme === 'dark'),
  toggle: vi.fn(),
  setTheme: setThemeSpy,
};

describe('CommandPaletteComponent', () => {
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let component: CommandPaletteComponent;
  let host: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    setThemeSpy.mockClear();
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [
        provideRouter([]),
        { provide: NavigationService, useValue: { sidebarItems: SIDEBAR } },
        { provide: BlogService, useValue: { posts: POSTS } },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    // afterNextRender fires after the first render; let it attach the
    // global keydown listener before we dispatch events.
    await TestBed.inject(ApplicationRef).whenStable();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  // Narrow access to protected members for behavior assertions.
  function inner(): {
    open: () => boolean;
    query: () => string;
    highlighted: () => number;
    onKey: (e: KeyboardEvent) => void;
    onInput: (v: string) => void;
  } {
    return component as unknown as ReturnType<typeof inner>;
  }

  describe('keyboard toggle', () => {
    it('starts closed', () => {
      expect(inner().open()).toBe(false);
    });

    it('Cmd+K opens the palette', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      expect(inner().open()).toBe(true);
    });

    it('Ctrl+K opens the palette (Windows/Linux)', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
      expect(inner().open()).toBe(true);
    });

    it('Cmd+K toggles open → closed → open', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      expect(inner().open()).toBe(true);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      expect(inner().open()).toBe(false);
    });

    it('Escape closes the palette when open', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      expect(inner().open()).toBe(true);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(inner().open()).toBe(false);
    });

    it('Escape does nothing while the palette is closed', () => {
      expect(inner().open()).toBe(false);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(inner().open()).toBe(false);
    });
  });

  describe('filtering', () => {
    it('starts with the full catalog (routes + posts + themes) when the query is empty', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      fixture.detectChanges();
      const items = host.querySelectorAll('.palette-item');
      expect(items.length).toBe(SIDEBAR.length + POSTS().length + THEME_REGISTRY.length);
    });

    it('filters by label, case-insensitive', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('ANGULAR');
      fixture.detectChanges();
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      expect(labels).toEqual(['Angular 21 Signals']);
    });

    it('filters by route', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('/projects');
      fixture.detectChanges();
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (el) => el.textContent?.trim() ?? '',
      );
      expect(labels).toEqual(['Projects']);
    });

    it('shows the "No matches." hint when nothing matches', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('zzz-never-matches');
      fixture.detectChanges();
      expect(host.querySelector('.palette-empty')?.textContent?.trim()).toBe('No matches.');
    });

    it('typing resets the highlighted index to 0', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(inner().highlighted()).toBe(1);
      inner().onInput('a');
      expect(inner().highlighted()).toBe(0);
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      fixture.detectChanges();
    });

    it('ArrowDown advances the highlighted item up to the last index', () => {
      const total = SIDEBAR.length + POSTS().length + THEME_REGISTRY.length;
      for (let i = 0; i < total + 2; i++) {
        inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      }
      expect(inner().highlighted()).toBe(total - 1);
    });

    it('ArrowUp walks back toward 0 and clamps there', () => {
      inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(inner().highlighted()).toBe(2);
      for (let i = 0; i < 5; i++) {
        inner().onKey(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      }
      expect(inner().highlighted()).toBe(0);
    });

    it('Enter invokes router.navigate with the highlighted item route', () => {
      inner().onKey(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(router.navigate).toHaveBeenCalledWith(['/about']);
    });
  });

  describe('theme actions', () => {
    it('catalog includes a "Switch theme: …" entry per registered theme', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('switch theme');
      fixture.detectChanges();
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (n) => n.textContent?.trim() ?? '',
      );
      expect(labels.length).toBe(THEME_REGISTRY.length);
      for (const def of THEME_REGISTRY) {
        expect(labels).toContain(`Switch theme: ${def.label}`);
      }
    });

    it('typing the registry id also surfaces the matching theme entry', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('tokyo');
      fixture.detectChanges();
      const labels = Array.from(host.querySelectorAll('.palette-label')).map(
        (n) => n.textContent?.trim() ?? '',
      );
      expect(labels).toContain('Switch theme: Tokyo Night');
    });

    it('Enter on a theme entry calls themeService.setTheme without router.navigate', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('tokyo');
      fixture.detectChanges();
      inner().onKey(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(setThemeSpy).toHaveBeenCalledWith('tokyo-night');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('renders the theme swatch dot ahead of the icon for theme entries', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('catppuccin');
      fixture.detectChanges();
      const swatch = host.querySelector('.palette-item .palette-swatch') as HTMLElement | null;
      expect(swatch).toBeTruthy();
      // jsdom normalises hex inline styles to `rgb(r, g, b)`. Convert the
      // registry swatch hex back to the same canonical form and compare
      // verbatim — keeps the assertion robust without leaking renderer
      // quirks into the spec body.
      const def = getThemeDef('catppuccin-mocha');
      const r = parseInt(def.swatch.slice(1, 3), 16);
      const g = parseInt(def.swatch.slice(3, 5), 16);
      const b = parseInt(def.swatch.slice(5, 7), 16);
      expect(swatch?.style.backgroundColor).toBe(`rgb(${r}, ${g}, ${b})`);
    });

    it('non-theme entries (routes, posts) do not render a swatch', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      inner().onInput('about');
      fixture.detectChanges();
      const items = host.querySelectorAll('.palette-item');
      const swatches = host.querySelectorAll('.palette-item .palette-swatch');
      expect(items.length).toBeGreaterThan(0);
      expect(swatches.length).toBe(0);
    });
  });

  describe('openWith()', () => {
    it('opens the dialog and pre-fills the query string', () => {
      component.openWith('theme:');
      expect(inner().open()).toBe(true);
      expect(inner().query()).toBe('theme:');
    });
  });
});
