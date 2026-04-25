import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditorTab } from '../../ui/editor-tab-bar/editor-tab-bar.component';

interface TabData {
  label: string;
  ext: string;
  color: string;
}

const HERO_TAB: EditorTab = {
  id: 'hero',
  label: 'Welcome',
  ext: '.tsx',
  color: '#61dafb',
  route: '/',
};

@Injectable({ providedIn: 'root' })
export class TabService {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private tabs = signal<EditorTab[]>([]);
  private activeId = signal<string>('');

  readonly openTabs = computed(() => this.tabs());
  readonly activeTabId = computed(() => this.activeId());

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;
        const segments = url.split('/').filter(Boolean);
        const routePath = segments[0] || 'hero';

        const tabData = this.resolveTabData();
        if (tabData) {
          this.openTab(routePath, tabData, url);
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

  private openTab(routePath: string, tabData: TabData, fullUrl: string): void {
    // Deep-linking to a non-home route should still pin the Welcome tab on
    // the left, matching what users expect from a tabbed editor UI.
    if (this.tabs().length === 0 && routePath !== 'hero') {
      this.tabs.set([HERO_TAB]);
    }

    // Keep tab.route in sync with the full URL so reselecting (e.g. the
    // "Blog" tab from inside /blog/some-slug) navigates back to the same
    // place rather than dropping the slug.
    const route = routePath === 'hero' ? '/' : fullUrl;
    const next: EditorTab = {
      id: routePath,
      label: tabData.label,
      ext: tabData.ext,
      color: tabData.color,
      route,
    };

    this.tabs.update((tabs) => {
      const idx = tabs.findIndex((t) => t.id === routePath);
      if (idx === -1) return [...tabs, next];
      // Preserve order; just refresh the route in place.
      const copy = tabs.slice();
      copy[idx] = next;
      return copy;
    });
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
        this.router.navigate(['/']);
      }
    }
  }

  closeAllTabs(): void {
    const hero = this.tabs().find((t) => t.id === 'hero');
    this.tabs.set(hero ? [hero] : []);
    this.router.navigate(['/']);
  }

  selectTab(tab: EditorTab): void {
    this.router.navigate([tab.route]);
  }
}
