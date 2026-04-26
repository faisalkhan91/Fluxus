import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SidebarComponent, SidebarItem } from './sidebar.component';

const MOCK_ITEMS: SidebarItem[] = [
  { type: 'link', label: 'About', ext: '.md', route: '/about', icon: 'user' },
  { type: 'link', label: 'Blog', ext: '.rss', route: '/blog', icon: 'file-text' },
  { type: 'divider', label: 'Work' },
  { type: 'link', label: 'Experience', ext: '.ts', route: '/experience', icon: 'briefcase' },
];

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.componentRef.setInput('collapsed', false);
    fixture.componentRef.setInput('isDark', true);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render nav link items', () => {
    const items = el.querySelectorAll('.nav-item');
    expect(items.length).toBe(3);
  });

  it('should render divider with label', () => {
    const divider = el.querySelector('.nav-divider');
    expect(divider).toBeTruthy();
    expect(divider?.querySelector('.divider-label')?.textContent?.trim()).toBe('Work');
  });

  it('should show labels when expanded', () => {
    const labels = el.querySelectorAll('.nav-label');
    expect(labels.length).toBe(3);
    expect(labels[0].textContent?.trim()).toBe('About');
  });

  it('should keep labels and identity in the DOM regardless of collapsed state', () => {
    // After the G1 cleanup the sidebar no longer mutates DOM on collapse —
    // the host's `transform: scaleX` collapses the rail and `:host(.collapsed)`
    // CSS rules hide labels via `display: none`. The DOM stays stable so
    // hydration is consistent and the compositor-only collapse contract is
    // preserved.
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    expect(el.classList.contains('collapsed')).toBe(true);
    expect(el.querySelector('.identity')).toBeTruthy();
    expect(el.querySelectorAll('.nav-label').length).toBe(3);
    expect(el.querySelector('.divider-label')).toBeTruthy();
  });

  it('should show identity block when expanded', () => {
    expect(el.querySelector('.identity')).toBeTruthy();
    expect(el.classList.contains('collapsed')).toBe(false);
  });

  it('should expose a single theme-toggle and resume-btn at every collapsed state', () => {
    const assertSingle = () => {
      expect(el.querySelectorAll('.theme-toggle').length).toBe(1);
      expect(el.querySelectorAll('.resume-btn').length).toBe(1);
      expect(el.querySelector('.theme-toggle--icon')).toBeNull();
      expect(el.querySelector('.resume-btn--icon')).toBeNull();
    };
    assertSingle();
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    assertSingle();
  });

  it('should reflect isDark in theme toggle label', () => {
    const btn = el.querySelector('.theme-toggle');
    expect(btn?.getAttribute('aria-label')).toBe('Switch to Light Mode');
    expect(btn?.textContent).toContain('Light Mode');
  });

  it('should update theme toggle for light mode', () => {
    fixture.componentRef.setInput('isDark', false);
    fixture.detectChanges();
    const btn = el.querySelector('.theme-toggle');
    expect(btn?.getAttribute('aria-label')).toBe('Switch to Dark Mode');
    expect(btn?.textContent).toContain('Dark Mode');
  });

  it('should emit themeToggled on click', () => {
    let emitted = false;
    component.themeToggled.subscribe(() => (emitted = true));
    const btn = el.querySelector('.theme-toggle') as HTMLButtonElement;
    btn.click();
    expect(emitted).toBe(true);
  });

  it('should emit resumeClicked on click', () => {
    let emitted = false;
    component.resumeClicked.subscribe(() => (emitted = true));
    const btn = el.querySelector('.resume-btn') as HTMLButtonElement;
    btn.click();
    expect(emitted).toBe(true);
  });

  it('should have navigation role on host', () => {
    expect(fixture.nativeElement.getAttribute('role')).toBe('navigation');
  });
});
