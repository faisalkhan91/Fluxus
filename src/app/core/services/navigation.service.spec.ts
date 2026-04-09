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
  });

  it('should provide 4 mobile nav items', () => {
    const items = service.mobileNavItems();
    expect(items.length).toBe(4);
    const labels = items.map((i) => i.label);
    expect(labels).toEqual(['Home', 'About', 'Blog', 'Contact']);
  });

  it('should provide mobile menu items with all pages', () => {
    const items = service.mobileMenuItems();
    expect(items.length).toBe(8);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('Home');
    expect(labels).toContain('Experience');
    expect(labels).toContain('Skills');
    expect(labels).toContain('Projects');
    expect(labels).toContain('Certifications');
    expect(labels).toContain('Blog');
    expect(labels).toContain('Contact');
  });

  it('should include Contact in both mobile nav and sidebar', () => {
    const mobileLabels = service.mobileNavItems().map((i) => i.label);
    const sidebarLabels = service.sidebarItems().map((i) => i.label);

    expect(mobileLabels).toContain('Contact');
    expect(sidebarLabels).toContain('Contact');
  });
});
