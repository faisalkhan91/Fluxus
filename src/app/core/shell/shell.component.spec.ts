import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
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
  sidebarItems: [],
  mobileNavItems: [],
  mobileMenuItems: [],
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

  // Chrome elements render unconditionally so the prerendered HTML is the
  // same for every viewport. CSS @media queries handle visibility, which the
  // Playwright responsive specs cover end-to-end.
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
});
