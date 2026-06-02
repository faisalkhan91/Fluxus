import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';
import { MediaQueryService } from '../services/media-query.service';
import { TabService } from '../services/tab.service';
import { NavigationService } from '../services/navigation.service';
import { ThemeService } from '../services/theme.service';
import { BlogService } from '../services/blog.service';
import { THEME_REGISTRY, getThemeDef, type ThemeId } from '../services/theme.registry';

const mockMedia = {
  showSidebar: signal(true),
  sidebarCollapsed: signal(false),
  isMobile: signal(false),
  showMobileNav: signal(false),
};

const mockTabService = {
  openTabs: signal([]),
  activeTabId: signal('hero'),
  selectTab: vi.fn(),
  closeTab: vi.fn(),
};

const mockNavService = {
  sidebarItems: [],
  mobileNavItems: [],
  mobileMenuItems: [],
};

/**
 * Stand-in ThemeService — exposes the same surface ShellComponent and the
 * real CommandPaletteComponent (which is instantiated transitively in
 * this fixture so `viewChild.required(CommandPaletteComponent)` resolves)
 * read at runtime.
 */
const themeSignal = signal<ThemeId>('crimson-dark');
const mockThemeService = {
  registry: THEME_REGISTRY,
  theme: themeSignal,
  themeDef: computed(() => getThemeDef(themeSignal())),
  scheme: computed(() => getThemeDef(themeSignal()).scheme),
  isDark: computed(() => getThemeDef(themeSignal()).scheme === 'dark'),
  toggle: vi.fn(),
  setTheme: vi.fn((id: ThemeId) => themeSignal.set(id)),
};

/**
 * The CommandPaletteComponent is rendered by the shell template; provide a
 * BlogService stub so its `posts()` signal works without exercising the
 * real markdown loader.
 */
const mockBlogService = {
  posts: signal([]),
};

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let component: ShellComponent;
  let el: HTMLElement;
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    themeSignal.set('crimson-dark');
    mockMedia.showSidebar.set(true);
    mockMedia.isMobile.set(false);
    mockMedia.showMobileNav.set(false);
    mockMedia.sidebarCollapsed.set(false);

    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        { provide: MediaQueryService, useValue: mockMedia },
        { provide: TabService, useValue: mockTabService },
        { provide: NavigationService, useValue: mockNavService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: BlogService, useValue: mockBlogService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render the sidebar unconditionally', () => {
    expect(el.querySelector('ui-sidebar')).toBeTruthy();
  });

  it('should render the editor tab bar unconditionally', () => {
    expect(el.querySelector('ui-editor-tab-bar')).toBeTruthy();
  });

  it('should render the mobile theme FAB unconditionally', () => {
    expect(el.querySelector('.mobile-theme-toggle')).toBeTruthy();
  });

  it('should render the mobile nav pill unconditionally', () => {
    expect(el.querySelector('ui-mobile-nav-pill')).toBeTruthy();
  });

  it('should call themeService.toggle on onThemeToggle', () => {
    component.onThemeToggle();
    expect(mockThemeService.toggle).toHaveBeenCalled();
  });

  it('should call window.open with resume PDF on onResumeDownload', () => {
    component.onResumeDownload();
    expect(windowOpenSpy).toHaveBeenCalledWith('assets/resume.pdf', '_blank');
  });

  it('should render skip link', () => {
    const skip = el.querySelector('.skip-link');
    expect(skip).toBeTruthy();
    expect(skip?.textContent).toContain('Skip to content');
  });

  it('exposes the active theme on the mobile FAB aria-label', () => {
    const btn = el.querySelector('.mobile-theme-toggle');
    expect(btn?.getAttribute('aria-label')).toContain('Theme: Crimson Dark');
    expect(btn?.getAttribute('aria-label')).toContain('switch to last light theme');
    expect(btn?.getAttribute('aria-label')).toContain('Shift+click to open the theme picker');
  });

  it('plain mobile FAB click toggles the theme', () => {
    component.onMobileThemeClick(new MouseEvent('click'));
    expect(mockThemeService.toggle).toHaveBeenCalled();
  });

  it('Shift+click on the mobile FAB opens the picker instead of toggling', () => {
    const openWithSpy = vi
      .spyOn(
        component as unknown as { onThemePickerRequested: () => void },
        'onThemePickerRequested',
      )
      .mockImplementation(() => {
        // The real path delegates to the palette viewChild; spy just
        // confirms the modifier-aware handler routed correctly.
      });
    component.onMobileThemeClick(new MouseEvent('click', { shiftKey: true }));
    expect(openWithSpy).toHaveBeenCalled();
    expect(mockThemeService.toggle).not.toHaveBeenCalled();
  });

  it('onThemePickerRequested asks the palette to open with theme: prefix', () => {
    // Drill into the private viewChild via the component instance to confirm
    // the wiring; the real CommandPaletteComponent is constructed transitively
    // because it lives in the shell's `imports` array, so the viewChild
    // signal resolves to a real instance.
    const palette = (
      component as unknown as { palette: () => { openWith: (q: string) => void } }
    ).palette();
    const openWithSpy = vi.spyOn(palette, 'openWith');
    component.onThemePickerRequested();
    expect(openWithSpy).toHaveBeenCalledWith('theme:');
  });

  describe('main-content focus on route navigation', () => {
    /*
      Configures a fresh TestBed with two real routes so we can drive the
      Router and observe whether the post-NavigationEnd focus orchestration
      moves focus onto `<main id="main-content" tabindex="-1">`. The
      shared describe-level fixture above uses `provideRouter([])`, which
      can't navigate, so we re-bootstrap inside this nested describe.
    */
    @Component({ template: '' })
    class DummyComponent {}

    let nestedFixture: ComponentFixture<ShellComponent>;
    let nestedEl: HTMLElement;
    let nestedRouter: Router;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ShellComponent],
        providers: [
          provideRouter([
            { path: '', component: DummyComponent },
            { path: 'about', component: DummyComponent },
            { path: 'projects', component: DummyComponent },
          ]),
          { provide: MediaQueryService, useValue: mockMedia },
          { provide: TabService, useValue: mockTabService },
          { provide: NavigationService, useValue: mockNavService },
          { provide: ThemeService, useValue: mockThemeService },
          { provide: BlogService, useValue: mockBlogService },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      nestedRouter = TestBed.inject(Router);
      nestedFixture = TestBed.createComponent(ShellComponent);
      nestedFixture.detectChanges();
      nestedEl = nestedFixture.nativeElement;
    });

    async function flushMicrotasks(): Promise<void> {
      await Promise.resolve();
    }

    it('does not focus #main-content on the initial navigation', async () => {
      // Cold-load focus belongs to the browser default (top of doc /
      // :target). Forcing focus to main on the very first NavigationEnd
      // would scroll-jump the page on first paint.
      await nestedRouter.navigate(['/']);
      await flushMicrotasks();
      const main = nestedEl.querySelector('#main-content');
      expect(document.activeElement).not.toBe(main);
    });

    it('focuses #main-content on subsequent path changes', async () => {
      await nestedRouter.navigate(['/']);
      await nestedRouter.navigate(['/about']);
      await flushMicrotasks();
      const main = nestedEl.querySelector('#main-content');
      expect(document.activeElement).toBe(main);
    });

    it('does not refocus on a same-path fragment-only change', async () => {
      // Pure-fragment changes (#section anchors) are handled by Angular's
      // anchorScrolling — moving focus to main would yank the SR cursor
      // away from the anchored heading the user just clicked toward.
      await nestedRouter.navigate(['/']);
      await nestedRouter.navigate(['/about']);
      await flushMicrotasks();

      // Move focus elsewhere so we can detect whether the next nav stole
      // it back to main.
      const skipLink = nestedEl.querySelector<HTMLAnchorElement>('.skip-link');
      skipLink?.focus();
      expect(document.activeElement).toBe(skipLink);

      await nestedRouter.navigate(['/about'], { fragment: 'section-2' });
      await flushMicrotasks();
      // Focus should still be on the skip link (or elsewhere) — NOT on main.
      const main = nestedEl.querySelector('#main-content');
      expect(document.activeElement).not.toBe(main);
    });
  });
});
