import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MobileNavPillComponent, MobileNavItem } from './mobile-nav-pill.component';

const MOCK_ITEMS: MobileNavItem[] = [
  { label: 'Home', route: '/hero', icon: 'home' },
  { label: 'About', route: '/about', icon: 'user' },
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
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render a link for each item', () => {
    const links = el.querySelectorAll('.pill-item');
    expect(links.length).toBe(3);
  });

  it('should set aria-label on each link', () => {
    const links = el.querySelectorAll('.pill-item');
    expect(links[0].getAttribute('aria-label')).toBe('Home');
    expect(links[1].getAttribute('aria-label')).toBe('About');
    expect(links[2].getAttribute('aria-label')).toBe('Contact');
  });

  it('should display the label text', () => {
    const labels = el.querySelectorAll('.pill-label');
    expect(labels[0].textContent?.trim()).toBe('Home');
    expect(labels[1].textContent?.trim()).toBe('About');
  });

  it('should have navigation role on host', () => {
    expect(fixture.nativeElement.getAttribute('role')).toBe('navigation');
  });
});
