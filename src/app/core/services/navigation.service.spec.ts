import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  let service: NavigationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide sidebar items as a signal', () => {
    const items = service.sidebarItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty('label');
    expect(items[0]).toHaveProperty('route');
    expect(items[0]).toHaveProperty('icon');
  });

  it('should provide mobile nav items as a signal', () => {
    const items = service.mobileNavItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty('label');
    expect(items[0]).toHaveProperty('route');
  });

  it('should include Home route in mobile nav but not sidebar', () => {
    const mobileLabels = service.mobileNavItems().map((i) => i.label);
    const sidebarLabels = service.sidebarItems().map((i) => i.label);

    expect(mobileLabels).toContain('Home');
    expect(sidebarLabels).not.toContain('Home');
  });

  it('should include Contact in both nav lists', () => {
    const mobileLabels = service.mobileNavItems().map((i) => i.label);
    const sidebarLabels = service.sidebarItems().map((i) => i.label);

    expect(mobileLabels).toContain('Contact');
    expect(sidebarLabels).toContain('Contact');
  });
});
