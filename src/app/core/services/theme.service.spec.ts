import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from './theme.service';
import { THEME_REGISTRY, type ThemeId } from './theme.registry';

const matchMediaMock = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

/**
 * Helper to install the same `<meta name="theme-color">` pair the real
 * index.html ships with, so spec-driven runtime swaps have a target to
 * write into. Cleaned up in afterEach.
 */
function installThemeColorMetas(): { dark: HTMLMetaElement; light: HTMLMetaElement } {
  const dark = document.createElement('meta');
  dark.setAttribute('name', 'theme-color');
  dark.setAttribute('media', '(prefers-color-scheme: dark)');
  dark.setAttribute('content', '#07070b');
  const light = document.createElement('meta');
  light.setAttribute('name', 'theme-color');
  light.setAttribute('media', '(prefers-color-scheme: light)');
  light.setAttribute('content', '#f0f0f3');
  document.head.append(dark, light);
  return { dark, light };
}

function clearThemeColorMetas(): void {
  for (const node of Array.from(document.head.querySelectorAll('meta[name="theme-color"]'))) {
    node.remove();
  }
}

describe('ThemeService', () => {
  let service: ThemeService;
  let originalMatchMedia: typeof window.matchMedia;
  let metas: { dark: HTMLMetaElement; light: HTMLMetaElement };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    clearThemeColorMetas();
    metas = installThemeColorMetas();
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
    clearThemeColorMetas();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('exposes the full registry in display order', () => {
    expect(service.registry).toBe(THEME_REGISTRY);
    expect(service.registry.length).toBeGreaterThanOrEqual(6);
  });

  it('defaults to crimson-dark when no preference is stored and system is dark', () => {
    expect(service.theme()).toBe('crimson-dark');
    expect(service.scheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('toggle bounces between last-dark and last-light picks', () => {
    service.toggle();
    expect(service.theme()).toBe('crimson-light');
    expect(service.scheme()).toBe('light');

    service.toggle();
    expect(service.theme()).toBe('crimson-dark');
  });

  it('persists every setTheme call to localStorage', () => {
    service.setTheme('tokyo-night');
    expect(localStorage.getItem('theme')).toBe('tokyo-night');

    service.setTheme('solarized-light');
    expect(localStorage.getItem('theme')).toBe('solarized-light');
  });

  it('mirrors runtime swaps to the data-theme attribute on every change', () => {
    service.setTheme('tokyo-night');
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-theme')).toBe('tokyo-night');

    service.setTheme('crimson-dark');
    TestBed.tick();
    // Unlike the legacy binary contract (which removed the attribute for the
    // default), the new effect always writes a concrete id so consumers can
    // rely on `[data-theme]` being present.
    expect(document.documentElement.getAttribute('data-theme')).toBe('crimson-dark');
  });

  it('rewrites <meta name="theme-color"> for the active scheme', () => {
    service.setTheme('tokyo-night');
    TestBed.tick();
    expect(metas.dark.getAttribute('content')).toBe('#1a1b26');
    // The opposite-scheme meta is left intact so users that swap back to
    // "match system" still see a sensible system-chrome colour.
    expect(metas.light.getAttribute('content')).toBe('#f0f0f3');

    service.setTheme('solarized-light');
    TestBed.tick();
    expect(metas.light.getAttribute('content')).toBe('#eee8d5');
  });

  it('toggle remembers the last pick within each scheme', () => {
    service.setTheme('tokyo-night');
    service.setTheme('solarized-light');
    service.toggle();
    expect(service.theme()).toBe('tokyo-night');
    service.toggle();
    expect(service.theme()).toBe('solarized-light');
  });

  it('ignores unknown ids defensively', () => {
    const before = service.theme();
    service.setTheme('not-a-real-theme' as ThemeId);
    expect(service.theme()).toBe(before);
  });
});

describe('ThemeService — legacy localStorage migration', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    clearThemeColorMetas();
    installThemeColorMetas();
    originalMatchMedia = window.matchMedia;
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    localStorage.clear();
    clearThemeColorMetas();
  });

  it('migrates a stored "light" value to crimson-light on read', () => {
    localStorage.setItem('theme', 'light');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('crimson-light');
    expect(localStorage.getItem('theme')).toBe('crimson-light');
  });

  it('migrates a stored "dark" value to crimson-dark on read', () => {
    localStorage.setItem('theme', 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('crimson-dark');
    expect(localStorage.getItem('theme')).toBe('crimson-dark');
  });

  it('falls back to the system preference when storage holds an unknown value', () => {
    localStorage.setItem('theme', 'midnight-banana');
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('crimson-light');
  });
});

describe('ThemeService — system preference', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    clearThemeColorMetas();
    installThemeColorMetas();
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    clearThemeColorMetas();
  });

  it('initialises to crimson-light when system prefers light and nothing is stored', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('crimson-light');
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

  it('does not register a prefers-color-scheme listener when storage is set', () => {
    localStorage.setItem('theme', 'tokyo-night');
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

describe('ThemeService (SSR)', () => {
  it('defaults to crimson-dark on the server', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('crimson-dark');
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

  it('setTheme is a no-op on the server (no localStorage access)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const svc = TestBed.inject(ThemeService);
    expect(() => svc.setTheme('tokyo-night')).not.toThrow();
    // Signal still updates so server-rendered HTML can read the value if
    // it ever needs to, but no DOM / storage side effects fire.
    expect(svc.theme()).toBe('tokyo-night');
  });
});
