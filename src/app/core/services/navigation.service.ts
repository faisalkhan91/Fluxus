import { Injectable } from '@angular/core';
import { SidebarNavItem } from '../../ui/sidebar/sidebar.component';
import { MobileNavItem } from '../../ui/mobile-nav-pill/mobile-nav-pill.component';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  readonly sidebarItems: SidebarNavItem[] = [
    { label: 'About', ext: '.md', route: '/about', icon: 'user' },
    { label: 'Experience', ext: '.ts', route: '/experience', icon: 'briefcase' },
    { label: 'Blog', ext: '.rss', route: '/blog', icon: 'file-text' },
    { label: 'Skills', ext: '.json', route: '/skills', icon: 'layers' },
    { label: 'Projects', ext: '.git', route: '/projects', icon: 'folder-git' },
    { label: 'Certifications', ext: '.pem', route: '/certifications', icon: 'award' },
    { label: 'Contact', ext: '.sh', route: '/contact', icon: 'mail' },
  ];

  readonly mobileNavItems: MobileNavItem[] = [
    { label: 'Home', route: '/hero', icon: 'home' },
    { label: 'About', route: '/about', icon: 'user' },
    { label: 'Work', route: '/experience', icon: 'briefcase' },
    { label: 'Blog', route: '/blog', icon: 'file-text' },
    { label: 'Skills', route: '/skills', icon: 'layers' },
    { label: 'Projects', route: '/projects', icon: 'folder-git' },
    { label: 'Certs', route: '/certifications', icon: 'award' },
    { label: 'Contact', route: '/contact', icon: 'mail' },
  ];
}
