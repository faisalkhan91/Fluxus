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
    originalMatchMedia = window.matchMedia;
    window.matchMedia = matchMediaMock;

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
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
});

describe('ThemeService (SSR)', () => {
  it('should default to dark on server', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
  });
});
