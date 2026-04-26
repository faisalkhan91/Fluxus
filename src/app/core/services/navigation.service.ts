import { Injectable } from '@angular/core';
import { SidebarItem } from '@ui/sidebar/sidebar.component';
import { MobileNavItem, MobileMenuItem } from '@ui/mobile-nav-pill/mobile-nav-pill.component';

interface NavLink {
  label: string;
  route: string;
  icon: string;
  ext: string;
  /** True for the small set surfaced in the mobile pill at the bottom. */
  pillSlot?: boolean;
  /** True when the entry is shown on the desktop sidebar. */
  inSidebar?: boolean;
  /** True when the entry is shown in the mobile drawer menu. */
  inMobileMenu?: boolean;
}

interface NavDivider {
  type: 'divider';
  label: string;
  inSidebar?: boolean;
  inMobileMenu?: boolean;
}

type NavEntry = ({ type: 'link' } & NavLink) | NavDivider;

const NAV: NavEntry[] = [
  // Home is only relevant to mobile UI (sidebar uses the avatar as home).
  {
    type: 'link',
    label: 'Home',
    route: '/',
    icon: 'home',
    ext: '.tsx',
    pillSlot: true,
    inMobileMenu: true,
  },
  {
    type: 'link',
    label: 'About',
    route: '/about',
    icon: 'user',
    ext: '.md',
    pillSlot: true,
    inSidebar: true,
    inMobileMenu: true,
  },
  {
    type: 'link',
    label: 'Blog',
    route: '/blog',
    icon: 'file-text',
    ext: '.rss',
    pillSlot: true,
    inSidebar: true,
    inMobileMenu: true,
  },
  { type: 'divider', label: 'Work', inSidebar: true, inMobileMenu: true },
  {
    type: 'link',
    label: 'Experience',
    route: '/experience',
    icon: 'briefcase',
    ext: '.ts',
    inSidebar: true,
    inMobileMenu: true,
  },
  {
    type: 'link',
    label: 'Skills',
    route: '/skills',
    icon: 'layers',
    ext: '.json',
    inSidebar: true,
    inMobileMenu: true,
  },
  {
    type: 'link',
    label: 'Projects',
    route: '/projects',
    icon: 'folder-git',
    ext: '.git',
    inSidebar: true,
    inMobileMenu: true,
  },
  {
    type: 'link',
    label: 'Certifications',
    route: '/certifications',
    icon: 'award',
    ext: '.pem',
    inSidebar: true,
    inMobileMenu: true,
  },
  { type: 'divider', label: '', inSidebar: true, inMobileMenu: true },
  {
    type: 'link',
    label: 'Contact',
    route: '/contact',
    icon: 'mail',
    ext: '.sh',
    pillSlot: true,
    inSidebar: true,
    inMobileMenu: true,
  },
];

@Injectable({ providedIn: 'root' })
export class NavigationService {
  /*
    All three navigation surfaces are derived once at construction from the
    single `NAV` registry. They were previously `computed()` signals, but
    the input (`NAV`) is a module-level constant — a `computed` over a
    constant pays the reactive-graph bookkeeping (signal version checks,
    dependency tracking) on every read for zero cache-busting benefit.
    Plain readonly arrays evaluate once and become inert, which is exactly
    what we want for static navigation data. Consumers access them as
    properties (`navService.sidebarItems`), not function calls.
  */
  readonly sidebarItems: SidebarItem[] = NAV.filter((e) => e.inSidebar).map((e) =>
    e.type === 'divider'
      ? { type: 'divider', label: e.label }
      : { type: 'link', label: e.label, ext: e.ext, route: e.route, icon: e.icon },
  );

  readonly mobileNavItems: MobileNavItem[] = NAV.filter(
    (e): e is { type: 'link' } & NavLink => e.type === 'link' && !!e.pillSlot,
  ).map((e) => ({ label: e.label, route: e.route, icon: e.icon }));

  readonly mobileMenuItems: MobileMenuItem[] = NAV.filter((e) => e.inMobileMenu).map((e) =>
    e.type === 'divider'
      ? { type: 'divider', label: e.label }
      : { type: 'link', label: e.label, route: e.route, icon: e.icon },
  );
}
