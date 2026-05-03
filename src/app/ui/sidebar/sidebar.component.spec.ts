import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SidebarComponent, SidebarItem } from './sidebar.component';
import { THEME_REGISTRY, type ThemeDef, getThemeDef } from '@core/services/theme.registry';

const MOCK_ITEMS: SidebarItem[] = [
  { type: 'link', label: 'About', ext: '.md', route: '/about', icon: 'user' },
  { type: 'link', label: 'Blog', ext: '.rss', route: '/blog', icon: 'file-text' },
  { type: 'divider', label: 'Work' },
  { type: 'link', label: 'Experience', ext: '.ts', route: '/experience', icon: 'briefcase' },
];

const CRIMSON_DARK: ThemeDef = getThemeDef('crimson-dark');
const CRIMSON_LIGHT: ThemeDef = getThemeDef('crimson-light');
const TOKYO: ThemeDef = getThemeDef('tokyo-night');

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
    fixture.componentRef.setInput('currentTheme', CRIMSON_DARK);
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

  it('should expose a single theme-toggle, picker chevron, and resume-btn at every collapsed state', () => {
    const assertSingles = () => {
      expect(el.querySelectorAll('.theme-toggle').length).toBe(1);
      expect(el.querySelectorAll('.theme-picker-btn').length).toBe(1);
      expect(el.querySelectorAll('.resume-btn').length).toBe(1);
    };
    assertSingles();
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    assertSingles();
  });

  it('renders the current theme label inside the toggle', () => {
    expect(el.querySelector('.theme-toggle-label')?.textContent?.trim()).toBe('Crimson Dark');
    fixture.componentRef.setInput('currentTheme', TOKYO);
    fixture.detectChanges();
    expect(el.querySelector('.theme-toggle-label')?.textContent?.trim()).toBe('Tokyo Night');
  });

  it('exposes the active theme + Shift+click hint via aria-label', () => {
    const btn = el.querySelector('.theme-toggle');
    expect(btn?.getAttribute('aria-label')).toContain('Theme: Crimson Dark');
    expect(btn?.getAttribute('aria-label')).toContain('switch to last light theme');
    expect(btn?.getAttribute('aria-label')).toContain('Shift+click to open the theme picker');

    fixture.componentRef.setInput('currentTheme', CRIMSON_LIGHT);
    fixture.detectChanges();
    expect(btn?.getAttribute('aria-label')).toContain('Theme: Crimson Light');
    expect(btn?.getAttribute('aria-label')).toContain('switch to last dark theme');
  });

  it('exposes the next-target hint in the aria-label across schemes', () => {
    // The `[name]` binding on `<ui-icon>` is a property, not an attribute,
    // so a getAttribute('name') round-trip would always return null in
    // jsdom. The visible-state contract that actually matters here — "the
    // user knows whether the click goes to dark or light" — is exposed
    // through the toggle's aria-label, which we assert end-to-end.
    const labelOnDark = el.querySelector('.theme-toggle')?.getAttribute('aria-label') ?? '';
    expect(labelOnDark).toContain('switch to last light theme');

    fixture.componentRef.setInput('currentTheme', CRIMSON_LIGHT);
    fixture.detectChanges();
    const labelOnLight = el.querySelector('.theme-toggle')?.getAttribute('aria-label') ?? '';
    expect(labelOnLight).toContain('switch to last dark theme');
  });

  it('emits themeToggled on a plain main-button click', () => {
    let emitted = 0;
    component.themeToggled.subscribe(() => emitted++);
    (el.querySelector('.theme-toggle') as HTMLButtonElement).click();
    expect(emitted).toBe(1);
  });

  it('emits themePickerRequested on a Shift+click of the main button', () => {
    let toggled = 0;
    let picker = 0;
    component.themeToggled.subscribe(() => toggled++);
    component.themePickerRequested.subscribe(() => picker++);
    (el.querySelector('.theme-toggle') as HTMLButtonElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, shiftKey: true }),
    );
    expect(toggled).toBe(0);
    expect(picker).toBe(1);
  });

  it('emits themePickerRequested on a click of the chevron picker button', () => {
    let picker = 0;
    component.themePickerRequested.subscribe(() => picker++);
    (el.querySelector('.theme-picker-btn') as HTMLButtonElement).click();
    expect(picker).toBe(1);
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

  it('every registry entry would render its own label correctly', () => {
    // Smoke-test: feeding any registered theme through the input updates
    // the label without throwing — guards against future ThemeDef shape
    // drift breaking the sidebar binding silently.
    for (const def of THEME_REGISTRY) {
      fixture.componentRef.setInput('currentTheme', def);
      fixture.detectChanges();
      expect(el.querySelector('.theme-toggle-label')?.textContent?.trim()).toBe(def.label);
    }
  });
});
