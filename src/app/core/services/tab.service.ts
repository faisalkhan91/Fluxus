import { Injectable, signal, computed, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import { EditorTab } from '../../ui/editor-tab-bar/editor-tab-bar.component';

@Injectable({ providedIn: 'root' })
export class TabService {
  private router = inject(Router);
  private tabs = signal<EditorTab[]>([]);
  private activeId = signal<string>('');

  readonly openTabs = computed(() => this.tabs());
  readonly activeTabId = computed(() => this.activeId());

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ).subscribe(event => {
      const url = event.urlAfterRedirects;
      const segments = url.split('/').filter(Boolean);
      const routePath = segments[0] || 'hero';
      this.openTab(routePath);
    });
  }

  private openTab(routePath: string): void {
    const routeData = this.getRouteData(routePath);
    if (!routeData) return;

    const exists = this.tabs().find(t => t.id === routePath);
    if (!exists) {
      this.tabs.update(tabs => [...tabs, {
        id: routePath,
        label: routeData.label,
        ext: routeData.ext,
        color: routeData.color,
        route: '/' + routePath,
      }]);
    }
    this.activeId.set(routePath);
  }

  closeTab(tab: EditorTab): void {
    if (tab.id === 'hero') return;

    const remaining = this.tabs().filter(t => t.id !== tab.id);
    this.tabs.set(remaining);

    if (this.activeId() === tab.id) {
      const last = remaining[remaining.length - 1];
      if (last) {
        this.router.navigate([last.route]);
      } else {
        this.router.navigate(['/hero']);
      }
    }
  }

  selectTab(tab: EditorTab): void {
    this.router.navigate([tab.route]);
  }

  private getRouteData(path: string): { label: string; ext: string; color: string } | null {
    const map: Record<string, { label: string; ext: string; color: string }> = {
      hero: { label: 'Welcome', ext: '.tsx', color: '#61dafb' },
      about: { label: 'About', ext: '.md', color: '#519aba' },
      experience: { label: 'Experience', ext: '.ts', color: '#3178c6' },
      skills: { label: 'Skills', ext: '.json', color: '#cbcb41' },
      projects: { label: 'Projects', ext: '.git', color: '#e64a19' },
      certifications: { label: 'Certifications', ext: '.pem', color: '#41b883' },
      contact: { label: 'Contact', ext: '.sh', color: '#89e051' },
      blog: { label: 'Blog', ext: '.rss', color: '#f78c40' },
    };
    return map[path] ?? null;
  }
}
