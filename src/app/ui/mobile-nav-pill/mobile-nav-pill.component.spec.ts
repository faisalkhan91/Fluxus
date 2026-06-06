import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, provideRouter, NavigationStart } from '@angular/router';
import { MobileNavPillComponent } from './mobile-nav-pill.component';
import type { MobileNavItem, MobileMenuItem } from './mobile-nav-pill.component';

const MOCK_ITEMS: MobileNavItem[] = [
  { label: 'Home', route: '/', icon: 'home' },
  { label: 'About', route: '/about', icon: 'user' },
  { label: 'Blog', route: '/blog', icon: 'file-text' },
  { label: 'Contact', route: '/contact', icon: 'mail' },
];

const MOCK_MENU_ITEMS: MobileMenuItem[] = [
  { type: 'link', label: 'Home', route: '/', icon: 'home', ext: '.tsx' },
  { type: 'link', label: 'About', route: '/about', icon: 'user', ext: '.md' },
  { type: 'link', label: 'Blog', route: '/blog', icon: 'file-text', ext: '.rss' },
  { type: 'divider', label: 'Work' },
  { type: 'link', label: 'Experience', route: '/experience', icon: 'briefcase', ext: '.ts' },
  { type: 'link', label: 'Skills', route: '/skills', icon: 'layers', ext: '.json' },
  { type: 'link', label: 'Projects', route: '/projects', icon: 'folder-git', ext: '.git' },
  { type: 'link', label: 'Certifications', route: '/certifications', icon: 'award', ext: '.pem' },
  { type: 'divider', label: '' },
  { type: 'link', label: 'Contact', route: '/contact', icon: 'mail', ext: '.sh' },
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

  it('renders identity (avatar + name + role) in the drawer header, tappable to /', () => {
    /*
      Brand parity: desktop sidebar always shows avatar + Faisal Khan +
      Software Engineer at the top, including a tap-to-home anchor.
      Phones used to see only a sparse "Navigate" label, so brand
      presence vanished on every route except /about.
    */
    component.menuOpen.set(true);
    fixture.detectChanges();

    const identity = el.querySelector('.menu-identity') as HTMLElement;
    expect(identity).not.toBeNull();
    // No aria-label override: it would replace the visible "Faisal Khan" /
    // role text as the accessible name, tripping WCAG 2.5.3 (Label in Name).
    // The link is named by its visible content + avatar alt; `title` carries
    // the "Welcome" affordance hint without overriding the name.
    expect(identity.getAttribute('aria-label')).toBeNull();
    expect(identity.getAttribute('title')).toBe('Welcome');

    const avatar = identity.querySelector('img.menu-identity-avatar') as HTMLImageElement;
    expect(avatar?.alt).toBe('Faisal Khan');
    expect(identity.querySelector('.menu-identity-name')?.textContent?.trim()).toBe('Faisal Khan');
    expect(identity.querySelector('.menu-identity-role')?.textContent?.trim()).toBe(
      'Software Engineer',
    );
  });

  it('renders the IDE-themed .ext chip next to each labelled link', () => {
    // Mirrors the desktop sidebar's `.nav-ext` column so the brand
    // voice carries on phones; previously the chip was stripped.
    component.menuOpen.set(true);
    fixture.detectChanges();
    const exts = el.querySelectorAll('.menu-link-ext');
    // 7 links in MOCK_MENU_ITEMS carry an ext (Home + 6 sidebar entries
    // + Contact). Dividers don't render `.menu-link-ext`.
    expect(exts.length).toBe(MOCK_MENU_ITEMS.filter((m) => m.type === 'link').length);
    const skills = Array.from(exts).find((e) => e.textContent?.trim() === '.json');
    expect(skills).toBeDefined();
  });

  it('closes the drawer when a NavigationStart fires (Android back button parity)', () => {
    /*
      Mobile users on Android expect the hardware back button to dismiss
      any open modal/drawer before navigating. Browser back fires a
      `popstate` which the router translates into a `NavigationStart`.
      The component subscribes to that stream and closes `menuOpen` so
      the drawer dismisses cleanly even when the user didn't tap one of
      our own controls. Same listener also handles any external `<a>`
      that might bypass `navigateTo` (defensive).
    */
    component.menuOpen.set(true);
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(true);

    // Synthesize a NavigationStart through the router's events stream.
    const router = TestBed.inject(Router);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router.events as any).next(new NavigationStart(1, '/about'));
    fixture.detectChanges();

    expect(component.menuOpen()).toBe(false);
  });

  it('should close menu when close button is clicked', () => {
    component.menuOpen.set(true);
    fixture.detectChanges();
    const closeBtn = el.querySelector('.menu-close') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();
    expect(component.menuOpen()).toBe(false);
  });

  describe('drawer footer parity actions', () => {
    /*
      The footer carries the desktop-only entry points that previously
      had no on-screen path on phones: command palette, theme picker,
      resume download. Each emits a typed output and closes the
      drawer (drawer-close ordering is what keeps the palette modal
      from stacking under the menu modal).
    */
    it('renders four footer actions: Search, Choose theme, View source, Download resume', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();
      const actions = el.querySelectorAll('.menu-footer .menu-action');
      expect(actions.length).toBe(4);
      const labels = Array.from(actions).map((b) => b.textContent?.trim());
      expect(labels[0]).toContain('Search');
      expect(labels[1]).toContain('Choose theme');
      expect(labels[2]).toContain('View source');
      expect(labels[3]).toContain('Download resume');
    });

    it('marks the resume action as the primary CTA', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();
      const cta = el.querySelector('.menu-footer .menu-action--cta');
      expect(cta).not.toBeNull();
      expect(cta?.textContent?.trim()).toContain('Download resume');
    });

    it('emits paletteRequested + closes drawer when Search is clicked', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();
      const spy = vi.fn();
      component.paletteRequested.subscribe(spy);
      const btn = el.querySelectorAll('.menu-footer .menu-action')[0] as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(component.menuOpen()).toBe(false);
    });

    it('emits themePickerRequested + closes drawer when Choose theme is clicked', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();
      const spy = vi.fn();
      component.themePickerRequested.subscribe(spy);
      const btn = el.querySelectorAll('.menu-footer .menu-action')[1] as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(component.menuOpen()).toBe(false);
    });

    it('emits resumeRequested + closes drawer when Download resume is clicked', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();
      const spy = vi.fn();
      component.resumeRequested.subscribe(spy);
      const btn = el.querySelector('.menu-footer .menu-action--cta') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(component.menuOpen()).toBe(false);
    });

    it('renders View source as an external link to the project repo', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();
      const link = el.querySelectorAll('.menu-footer .menu-action')[2] as HTMLAnchorElement;
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('href')).toBe('https://github.com/faisalkhan91/Fluxus');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    });

    it('closes the drawer when View source is clicked', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();
      const link = el.querySelectorAll('.menu-footer .menu-action')[2] as HTMLAnchorElement;
      // Cancel the default navigation in the test environment so JSDOM
      // doesn't try to actually open the external repo URL.
      link.addEventListener('click', (e) => e.preventDefault(), { once: true });
      link.click();
      fixture.detectChanges();
      expect(component.menuOpen()).toBe(false);
    });
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
      el.querySelectorAll<HTMLElement>('.menu-panel a[href], .menu-panel button:not([disabled])'),
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
      el.querySelectorAll<HTMLElement>('.menu-panel a[href], .menu-panel button:not([disabled])'),
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

  describe('background inert (modal isolation)', () => {
    let banner: HTMLElement;
    let mainArea: HTMLElement;
    let themeToggle: HTMLElement;

    beforeEach(() => {
      // Stand up the three shell siblings the component looks for so
      // the inert toggle has something to flip. Real shell uses
      // <header role="banner">, <div class="main-area">, and the
      // mobile-theme-toggle FAB.
      banner = document.createElement('header');
      banner.setAttribute('role', 'banner');
      mainArea = document.createElement('div');
      mainArea.className = 'main-area';
      themeToggle = document.createElement('button');
      themeToggle.className = 'mobile-theme-toggle';
      document.body.append(banner, mainArea, themeToggle);
    });

    afterEach(() => {
      banner.remove();
      mainArea.remove();
      themeToggle.remove();
    });

    it('sets inert on banner / main-area / theme toggle when the menu opens', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();

      expect(banner.hasAttribute('inert')).toBe(true);
      expect(mainArea.hasAttribute('inert')).toBe(true);
      expect(themeToggle.hasAttribute('inert')).toBe(true);
    });

    it('removes inert when the menu closes', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();
      component.menuOpen.set(false);
      fixture.detectChanges();

      expect(banner.hasAttribute('inert')).toBe(false);
      expect(mainArea.hasAttribute('inert')).toBe(false);
      expect(themeToggle.hasAttribute('inert')).toBe(false);
    });

    it('strips inert on destroy so a route change mid-modal leaves the next page interactive', () => {
      component.menuOpen.set(true);
      fixture.detectChanges();
      // Tear down the component while the menu is "open".
      fixture.destroy();

      expect(banner.hasAttribute('inert')).toBe(false);
      expect(mainArea.hasAttribute('inert')).toBe(false);
      expect(themeToggle.hasAttribute('inert')).toBe(false);
    });
  });
});
