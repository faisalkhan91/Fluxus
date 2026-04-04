import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { MediaQueryService } from './media-query.service';

describe('MediaQueryService (browser)', () => {
  let service: MediaQueryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(MediaQueryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return a valid breakpoint', () => {
    const bp = service.breakpoint();
    expect(['mobile', 'tablet', 'desktop', 'wide']).toContain(bp);
  });

  it('should expose computed booleans', () => {
    expect(typeof service.isMobile()).toBe('boolean');
    expect(typeof service.isTablet()).toBe('boolean');
    expect(typeof service.isDesktop()).toBe('boolean');
    expect(typeof service.showSidebar()).toBe('boolean');
    expect(typeof service.showMobileNav()).toBe('boolean');
  });
});

describe('MediaQueryService (SSR)', () => {
  it('should default to wide breakpoint on server (1280px default)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(MediaQueryService);
    expect(service.breakpoint()).toBe('wide');
    expect(service.showSidebar()).toBe(true);
    expect(service.showMobileNav()).toBe(false);
  });
});
