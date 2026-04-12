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

  it('should hide labels and divider labels when collapsed', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    const labels = el.querySelectorAll('.nav-label');
    expect(labels.length).toBe(0);
    const dividerLabels = el.querySelectorAll('.divider-label');
    expect(dividerLabels.length).toBe(0);
  });

  it('should show identity block when expanded', () => {
    expect(el.querySelector('.identity')).toBeTruthy();
  });

  it('should hide identity block when collapsed', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    expect(el.querySelector('.identity')).toBeNull();
  });

  it('should show full footer buttons when expanded', () => {
    const themeBtn = el.querySelector('.theme-toggle:not(.theme-toggle--icon)');
    const resumeBtn = el.querySelector('.resume-btn:not(.resume-btn--icon)');
    expect(themeBtn).toBeTruthy();
    expect(resumeBtn).toBeTruthy();
  });

  it('should show icon-only footer when collapsed', () => {
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    const iconTheme = el.querySelector('.theme-toggle--icon');
    const iconResume = el.querySelector('.resume-btn--icon');
    expect(iconTheme).toBeTruthy();
    expect(iconResume).toBeTruthy();
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
