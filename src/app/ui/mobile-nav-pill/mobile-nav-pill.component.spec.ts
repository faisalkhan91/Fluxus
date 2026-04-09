import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MobileNavPillComponent, MobileNavItem } from './mobile-nav-pill.component';

const MOCK_ITEMS: MobileNavItem[] = [
  { label: 'Home', route: '/', icon: 'home' },
  { label: 'About', route: '/about', icon: 'user' },
  { label: 'Blog', route: '/blog', icon: 'file-text' },
  { label: 'Contact', route: '/contact', icon: 'mail' },
];

const MOCK_MENU_ITEMS: MobileNavItem[] = [
  { label: 'Home', route: '/', icon: 'home' },
  { label: 'About', route: '/about', icon: 'user' },
  { label: 'Experience', route: '/experience', icon: 'briefcase' },
  { label: 'Skills', route: '/skills', icon: 'layers' },
  { label: 'Projects', route: '/projects', icon: 'folder-git' },
  { label: 'Certifications', route: '/certifications', icon: 'award' },
  { label: 'Blog', route: '/blog', icon: 'file-text' },
  { label: 'Contact', route: '/contact', icon: 'mail' },
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

  it('should render all menu items in the overlay as buttons', () => {
    component.menuOpen.set(true);
    fixture.detectChanges();
    const links = el.querySelectorAll('.menu-link');
    expect(links.length).toBe(MOCK_MENU_ITEMS.length);
    expect(links[0].tagName).toBe('BUTTON');
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
});
