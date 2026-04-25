import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { TabService } from './tab.service';
import { EditorTab } from '@ui/editor-tab-bar/editor-tab-bar.component';

@Component({ template: '' })
class DummyComponent {}

describe('TabService', () => {
  let service: TabService;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: DummyComponent,
            pathMatch: 'full',
            data: { tab: { label: 'Home', ext: '.tsx', color: '#61dafb' } },
          },
          {
            path: 'about',
            component: DummyComponent,
            data: { tab: { label: 'About', ext: '.md', color: '#42b883' } },
          },
          {
            path: 'contact',
            component: DummyComponent,
            data: { tab: { label: 'Contact', ext: '.sh', color: '#f97316' } },
          },
          {
            path: 'blog',
            component: DummyComponent,
            data: { tab: { label: 'Blog', ext: '.rss', color: '#f78c40' } },
          },
          {
            path: 'blog/:slug',
            component: DummyComponent,
            data: { tab: { label: 'Blog', ext: '.rss', color: '#f78c40' } },
          },
        ]),
      ],
    });

    router = TestBed.inject(Router);
    service = TestBed.inject(TabService);
    await router.navigate(['/']);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open a tab on navigation', () => {
    expect(service.openTabs().length).toBeGreaterThanOrEqual(1);
    expect(service.activeTabId()).toBe('hero');
  });

  it('should open a new tab on navigation to a different route', async () => {
    await router.navigate(['/about']);
    expect(service.openTabs().some((t) => t.id === 'about')).toBe(true);
    expect(service.activeTabId()).toBe('about');
  });

  it('should not duplicate tabs on repeated navigation', async () => {
    await router.navigate(['/about']);
    await router.navigate(['/']);
    await router.navigate(['/about']);

    const aboutTabs = service.openTabs().filter((t) => t.id === 'about');
    expect(aboutTabs).toHaveLength(1);
  });

  it('should not close the hero tab', () => {
    const heroTab = service.openTabs().find((t) => t.id === 'hero')!;
    service.closeTab(heroTab);

    expect(service.openTabs().some((t) => t.id === 'hero')).toBe(true);
  });

  it('should close a non-hero tab and navigate to the last remaining tab', async () => {
    await router.navigate(['/about']);
    const aboutTab = service.openTabs().find((t) => t.id === 'about')!;

    const navigateSpy = vi.spyOn(router, 'navigate');
    service.closeTab(aboutTab);

    expect(service.openTabs().some((t) => t.id === 'about')).toBe(false);
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('closeAllTabs() keeps only the hero tab and routes home', async () => {
    await router.navigate(['/about']);
    await router.navigate(['/contact']);
    expect(service.openTabs().length).toBeGreaterThan(1);

    const navigateSpy = vi.spyOn(router, 'navigate');
    service.closeAllTabs();

    expect(service.openTabs().map((t) => t.id)).toEqual(['hero']);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should navigate to a tab via selectTab', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const tab: EditorTab = {
      id: 'about',
      label: 'About',
      ext: '.md',
      color: '#42b883',
      route: '/about',
    };
    service.selectTab(tab);
    expect(navigateSpy).toHaveBeenCalledWith(['/about']);
  });

  it('preserves the slug in the tab.route for /blog/:slug', async () => {
    await router.navigate(['/blog', 'first-post']);

    const blogTab = service.openTabs().find((t) => t.id === 'blog');
    expect(blogTab?.route).toBe('/blog/first-post');
  });

  it('updates the existing blog tab when navigating between blog URLs', async () => {
    await router.navigate(['/blog']);
    let blogTabs = service.openTabs().filter((t) => t.id === 'blog');
    expect(blogTabs).toHaveLength(1);
    expect(blogTabs[0].route).toBe('/blog');

    await router.navigate(['/blog', 'first-post']);
    blogTabs = service.openTabs().filter((t) => t.id === 'blog');
    expect(blogTabs).toHaveLength(1);
    expect(blogTabs[0].route).toBe('/blog/first-post');
  });

  it('inserts the Welcome tab when deep-linking to a non-home route', async () => {
    // Reset by recreating the service with a deep-link as the first nav.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: DummyComponent,
            pathMatch: 'full',
            data: { tab: { label: 'Home', ext: '.tsx', color: '#61dafb' } },
          },
          {
            path: 'about',
            component: DummyComponent,
            data: { tab: { label: 'About', ext: '.md', color: '#42b883' } },
          },
        ]),
      ],
    });
    const r = TestBed.inject(Router);
    const s = TestBed.inject(TabService);
    await r.navigate(['/about']);

    const ids = s.openTabs().map((t) => t.id);
    expect(ids[0]).toBe('hero');
    expect(ids).toContain('about');
  });
});
