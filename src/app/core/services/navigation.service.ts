import { Injectable, signal } from '@angular/core';
import { SidebarItem } from '../../ui/sidebar/sidebar.component';
import { MobileNavItem, MobileMenuItem } from '../../ui/mobile-nav-pill/mobile-nav-pill.component';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  readonly sidebarItems = signal<SidebarItem[]>([
    { type: 'link', label: 'About', ext: '.md', route: '/about', icon: 'user' },
    { type: 'link', label: 'Blog', ext: '.rss', route: '/blog', icon: 'file-text' },
    { type: 'divider', label: 'Work' },
    {
      type: 'link',
      label: 'Experience',
      ext: '.ts',
      route: '/experience',
      icon: 'briefcase',
    },
    { type: 'link', label: 'Skills', ext: '.json', route: '/skills', icon: 'layers' },
    {
      type: 'link',
      label: 'Projects',
      ext: '.git',
      route: '/projects',
      icon: 'folder-git',
    },
    {
      type: 'link',
      label: 'Certifications',
      ext: '.pem',
      route: '/certifications',
      icon: 'award',
    },
    { type: 'divider', label: '' },
    { type: 'link', label: 'Contact', ext: '.sh', route: '/contact', icon: 'mail' },
  ]);

  readonly mobileNavItems = signal<MobileNavItem[]>([
    { label: 'Home', route: '/', icon: 'home' },
    { label: 'About', route: '/about', icon: 'user' },
    { label: 'Blog', route: '/blog', icon: 'file-text' },
    { label: 'Contact', route: '/contact', icon: 'mail' },
  ]);

  readonly mobileMenuItems = signal<MobileMenuItem[]>([
    { type: 'link', label: 'Home', route: '/', icon: 'home' },
    { type: 'link', label: 'About', route: '/about', icon: 'user' },
    { type: 'link', label: 'Blog', route: '/blog', icon: 'file-text' },
    { type: 'divider', label: 'Work' },
    { type: 'link', label: 'Experience', route: '/experience', icon: 'briefcase' },
    { type: 'link', label: 'Skills', route: '/skills', icon: 'layers' },
    { type: 'link', label: 'Projects', route: '/projects', icon: 'folder-git' },
    {
      type: 'link',
      label: 'Certifications',
      route: '/certifications',
      icon: 'award',
    },
    { type: 'divider', label: '' },
    { type: 'link', label: 'Contact', route: '/contact', icon: 'mail' },
  ]);
}
