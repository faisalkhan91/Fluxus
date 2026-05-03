import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
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
      .spyOn(component as unknown as { onThemePickerRequested: () => void }, 'onThemePickerRequested')
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
});
