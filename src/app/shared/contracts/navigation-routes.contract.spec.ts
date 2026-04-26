/**
 * Contract test: every route advertised by NavigationService must correspond
 * to an actual path declared in app.routes.ts. Catches accidental drift
 * (e.g. moving a feature route + forgetting to update the sidebar) before
 * a user clicks a 404 link.
 */
import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NavigationService } from '@core/services/navigation.service';
import { routes } from '../../app.routes';

function collectPaths(routeList: typeof routes, parent = ''): string[] {
  const collected: string[] = [];
  for (const route of routeList) {
    if (typeof route.path !== 'string') continue;
    const full = `/${[parent, route.path].filter(Boolean).join('/')}`.replace(/\/+/g, '/');
    collected.push(full === '//' ? '/' : full);
    if (route.children?.length) {
      collected.push(
        ...collectPaths(route.children, [parent, route.path].filter(Boolean).join('/')),
      );
    }
  }
  return collected;
}

describe('navigation routes contract', () => {
  it('every NavigationService route is declared in app.routes', () => {
    TestBed.configureTestingModule({});
    const nav = TestBed.inject(NavigationService);

    const declared = new Set(collectPaths(routes));
    const advertised = new Set<string>([
      ...nav.sidebarItems.filter((i) => i.type === 'link').map((i) => i.route),
      ...nav.mobileNavItems.map((i) => i.route),
      ...nav.mobileMenuItems.filter((i) => i.type === 'link').map((i) => i.route),
    ]);

    for (const route of advertised) {
      expect(
        declared,
        `route "${route}" advertised by NavigationService is missing from app.routes`,
      ).toContain(route);
    }
  });
});
