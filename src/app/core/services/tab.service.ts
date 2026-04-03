import { Injectable, signal, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { EditorTab } from '../../ui/editor-tab-bar/editor-tab-bar.component';

interface TabData {
  label: string;
  ext: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class TabService {
  private router = inject(Router);
  private tabs = signal<EditorTab[]>([]);
  private activeId = signal<string>('');

  readonly openTabs = computed(() => this.tabs());
  readonly activeTabId = computed(() => this.activeId());

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects;
        const segments = url.split('/').filter(Boolean);
        const routePath = segments[0] || 'hero';

        const tabData = this.resolveTabData();
        if (tabData) {
          this.openTab(routePath, tabData);
        }
      });
  }

  private resolveTabData(): TabData | null {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const data = route.snapshot.data?.['tab'];
    if (!data) return null;
    return { label: data['label'], ext: data['ext'], color: data['color'] };
  }

  private openTab(routePath: string, tabData: TabData): void {
    const exists = this.tabs().find((t) => t.id === routePath);
    if (!exists) {
      this.tabs.update((tabs) => [
        ...tabs,
        {
          id: routePath,
          label: tabData.label,
          ext: tabData.ext,
          color: tabData.color,
          route: '/' + routePath,
        },
      ]);
    }
    this.activeId.set(routePath);
  }

  closeTab(tab: EditorTab): void {
    if (tab.id === 'hero') return;

    const remaining = this.tabs().filter((t) => t.id !== tab.id);
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
}
