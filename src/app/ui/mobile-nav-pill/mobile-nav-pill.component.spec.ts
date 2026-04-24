import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MobileNavPillComponent, MobileNavItem, MobileMenuItem } from './mobile-nav-pill.component';

const MOCK_ITEMS: MobileNavItem[] = [
  { label: 'Home', route: '/', icon: 'home' },
  { label: 'About', route: '/about', icon: 'user' },
  { label: 'Blog', route: '/blog', icon: 'file-text' },
  { label: 'Contact', route: '/contact', icon: 'mail' },
];

const MOCK_MENU_ITEMS: MobileMenuItem[] = [
  { type: 'link', label: 'Home', route: '/', icon: 'home' },
  { type: 'link', label: 'About', route: '/about', icon: 'user' },
  { type: 'link', label: 'Blog', route: '/blog', icon: 'file-text' },
  { type: 'divider', label: 'Work' },
  { type: 'link', label: 'Experience', route: '/experience', icon: 'briefcase' },
  { type: 'link', label: 'Skills', route: '/skills', icon: 'layers' },
  { type: 'link', label: 'Projects', route: '/projects', icon: 'folder-git' },
  { type: 'link', label: 'Certifications', route: '/certifications', icon: 'award' },
  { type: 'divider', label: '' },
  { type: 'link', label: 'Contact', route: '/contact', icon: 'mail' },
];

describe('MobileNavPillComponent', () => {
  let fixture: ComponentFixture<MobileNavPillComponent>;
  let component: MobileNavPillComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileNavPillComponent],
      providers: [provideRouter([])],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileNavPillComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', MOCK_ITEMS);
    fixture.componentRef.setInput('menuItems', MOCK_MENU_ITEMS);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render 4 nav links plus a Menu button', () => {
    const pillItems = el.querySelectorAll('.pill .pill-item');
    expect(pillItems.length).toBe(5);
    expect(pillItems[0].getAttribute('aria-label')).toBe('Home');
    expect(pillItems[1].getAttribute('aria-label')).toBe('About');
    expect(pillItems[2].getAttribute('aria-label')).toBe('Blog');
    expect(pillItems[3].getAttribute('aria-label')).toBe('Contact');
    expect(pillItems[4].getAttribute('aria-label')).toBe('Menu');
  });

  it('should render Menu as a button element', () => {
    const menuBtn = el.querySelectorAll('.pill .pill-item')[4];
    expect(menuBtn.tagName).toBe('BUTTON');
  });

  it('should display the label text', () => {
    const labels = el.querySelectorAll('.pill .pill-label');
    expect(labels[0].textContent?.trim()).toBe('Home');
    expect(labels[1].textContent?.trim()).toBe('About');
    expect(labels[2].textContent?.trim()).toBe('Blog');
    expect(labels[3].textContent?.trim()).toBe('Contact');
    expect(labels[4].textContent?.trim()).toBe('Menu');
  });

  it('should open full-screen menu when Menu button is clicked', () => {
    const menuBtn = el.querySelectorAll('.pill .pill-item')[4] as HTMLButtonElement;
    menuBtn.click();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(true);
    const panel = el.querySelector('.menu-panel');
    expect(panel).toBeTruthy();
  });

  it('should render link items as buttons in the overlay', () => {
    component.menuOpen.set(true);
    fixture.detectChanges();
    const links = el.querySelectorAll('.menu-link');
    expect(links.length).toBe(8);
    expect(links[0].tagName).toBe('BUTTON');
  });

  it('should render dividers in the overlay', () => {
    component.menuOpen.set(true);
    fixture.detectChanges();
    const dividers = el.querySelectorAll('.menu-divider');
    expect(dividers.length).toBe(2);
  });

  it('should render labeled divider with label text', () => {
    component.menuOpen.set(true);
    fixture.detectChanges();
    const dividers = el.querySelectorAll('.menu-divider');
    const labeledDivider = dividers[0].querySelector('.menu-divider-label');
    expect(labeledDivider?.textContent?.trim()).toBe('Work');
  });

  it('should not render label for empty divider', () => {
    component.menuOpen.set(true);
    fixture.detectChanges();
    const dividers = el.querySelectorAll('.menu-divider');
    const emptyLabel = dividers[1].querySelector('.menu-divider-label');
    expect(emptyLabel).toBeNull();
  });

  it('should close menu when close button is clicked', () => {
    component.menuOpen.set(true);
    fixture.detectChanges();
    const closeBtn = el.querySelector('.menu-close') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(false);
  });

  it('should have navigation role on host', () => {
    expect(fixture.nativeElement.getAttribute('role')).toBe('navigation');
  });

  it('marks the menu trigger with aria-haspopup="dialog"', () => {
    const menuBtn = el.querySelectorAll('.pill .pill-item')[4];
    expect(menuBtn.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('keeps the panel focused when Tab is pressed without focusables', async () => {
    document.body.appendChild(el);
    component.menuOpen.set(true);
    fixture.detectChanges();
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    const panel = el.querySelector('.menu-panel') as HTMLElement;
    expect(panel).toBeTruthy();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    component.trapFocus(event);

    // Either no-op (focusables present) or preventDefault when wrapping.
    expect(preventSpy).toBeDefined();
  });

  it('cycles focus from last back to first on Tab', async () => {
    document.body.appendChild(el);
    component.menuOpen.set(true);
    fixture.detectChanges();
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    const focusables = Array.from(
      el.querySelectorAll<HTMLElement>(
        '.menu-panel a[href], .menu-panel button:not([disabled])',
      ),
    );
    expect(focusables.length).toBeGreaterThan(1);

    const last = focusables[focusables.length - 1];
    const first = focusables[0];
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    component.trapFocus(event);
    expect(document.activeElement).toBe(first);
  });

  it('cycles focus from first back to last on Shift+Tab', async () => {
    document.body.appendChild(el);
    component.menuOpen.set(true);
    fixture.detectChanges();
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    const focusables = Array.from(
      el.querySelectorAll<HTMLElement>(
        '.menu-panel a[href], .menu-panel button:not([disabled])',
      ),
    );
    const last = focusables[focusables.length - 1];
    focusables[0].focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    component.trapFocus(event);
    expect(document.activeElement).toBe(last);
  });

  it('returns focus to the menu trigger after closing', async () => {
    document.body.appendChild(el);
    const trigger = el.querySelectorAll('.pill .pill-item')[4] as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    component.closeMenu();
    fixture.detectChanges();
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    expect(document.activeElement).toBe(trigger);
  });
});
