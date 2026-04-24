import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from './theme.service';

const matchMediaMock = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

describe('ThemeService', () => {
  let service: ThemeService;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    originalMatchMedia = window.matchMedia;
    window.matchMedia = matchMediaMock;

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.removeAttribute('data-theme');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to dark theme when no preference stored', () => {
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('should toggle from dark to light', () => {
    service.toggle();
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('should toggle back to dark', () => {
    service.toggle();
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('should persist theme preference to localStorage', () => {
    service.toggle();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('mirrors runtime toggles to data-theme (pre-paint script owns the initial value)', () => {
    document.documentElement.removeAttribute('data-theme');

    service.toggle();
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    service.toggle();
    TestBed.tick();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});

describe('ThemeService (with stored light preference)', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('theme', 'light');
    originalMatchMedia = window.matchMedia;
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    localStorage.clear();
  });

  it('honors a stored "light" preference handed off by the pre-paint script', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('does not register a prefers-color-scheme listener when storage is set', () => {
    const addEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener,
      removeEventListener: vi.fn(),
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    TestBed.inject(ThemeService);

    expect(addEventListener).not.toHaveBeenCalled();
  });
});

describe('ThemeService (system prefers light, no storage)', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('initialises to light from prefers-color-scheme when nothing is stored', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
  });

  it('subscribes to prefers-color-scheme changes only when no preference is stored', () => {
    const addEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener,
      removeEventListener: vi.fn(),
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    TestBed.inject(ThemeService);

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

describe('ThemeService (SSR)', () => {
  it('should default to dark on server', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });

  it('does not write data-theme on the server', () => {
    document.documentElement.removeAttribute('data-theme');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    TestBed.inject(ThemeService);
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
