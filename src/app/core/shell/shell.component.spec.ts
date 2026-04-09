import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter, RouterOutlet } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ShellComponent } from './shell.component';
import { MediaQueryService } from '../services/media-query.service';
import { TabService } from '../services/tab.service';
import { NavigationService } from '../services/navigation.service';
import { ThemeService } from '../services/theme.service';

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
  sidebarItems: signal([]),
  mobileNavItems: signal([]),
  mobileMenuItems: signal([]),
};

const mockThemeService = {
  isDark: signal(true),
  toggle: vi.fn(),
};

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let component: ShellComponent;
  let el: HTMLElement;
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockMedia.showSidebar.set(true);
    mockMedia.isMobile.set(false);
    mockMedia.showMobileNav.set(false);
    mockMedia.sidebarCollapsed.set(false);

    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: MediaQueryService, useValue: mockMedia },
        { provide: TabService, useValue: mockTabService },
        { provide: NavigationService, useValue: mockNavService },
        { provide: ThemeService, useValue: mockThemeService },
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

  it('should show sidebar when showSidebar is true', () => {
    expect(el.querySelector('ui-sidebar')).toBeTruthy();
  });

  it('should hide sidebar when showSidebar is false', () => {
    mockMedia.showSidebar.set(false);
    fixture.detectChanges();
    expect(el.querySelector('ui-sidebar')).toBeNull();
  });

  it('should show editor tab bar when showSidebar is true', () => {
    expect(el.querySelector('ui-editor-tab-bar')).toBeTruthy();
  });

  it('should hide editor tab bar when showSidebar is false', () => {
    mockMedia.showSidebar.set(false);
    fixture.detectChanges();
    expect(el.querySelector('ui-editor-tab-bar')).toBeNull();
  });

  it('should show mobile theme FAB when isMobile is true', () => {
    mockMedia.isMobile.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.mobile-theme-toggle')).toBeTruthy();
  });

  it('should hide mobile theme FAB when isMobile is false', () => {
    expect(el.querySelector('.mobile-theme-toggle')).toBeNull();
  });

  it('should show mobile nav pill when showMobileNav is true', () => {
    mockMedia.showMobileNav.set(true);
    fixture.detectChanges();
    expect(el.querySelector('ui-mobile-nav-pill')).toBeTruthy();
  });

  it('should hide mobile nav pill when showMobileNav is false', () => {
    expect(el.querySelector('ui-mobile-nav-pill')).toBeNull();
  });

  it('should call themeService.toggle on onThemeToggle', () => {
    component.onThemeToggle();
    expect(mockThemeService.toggle).toHaveBeenCalled();
  });

  it('should call window.open with resume PDF on onResumeDownload', () => {
    component.onResumeDownload();
    expect(windowOpenSpy).toHaveBeenCalledWith('assets/resume.pdf', '_blank');
  });

  it('should return empty string from prepareRoute when outlet has no data', () => {
    const result = component.prepareRoute({ activatedRouteData: {} } as RouterOutlet);
    expect(result).toBe('');
  });

  it('should return label from prepareRoute when outlet has tab data', () => {
    const result = component.prepareRoute({
      activatedRouteData: { tab: { label: 'About' } },
    } as unknown as RouterOutlet);
    expect(result).toBe('About');
  });

  it('should render skip link', () => {
    const skip = el.querySelector('.skip-link');
    expect(skip).toBeTruthy();
    expect(skip?.textContent).toContain('Skip to content');
  });
});
