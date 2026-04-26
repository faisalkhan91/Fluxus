import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NavigationEnd, Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;
  let component: NotFoundComponent;
  let el: HTMLElement;
  let routerEvents$: Subject<NavigationEnd>;
  let router: Router;

  beforeEach(async () => {
    routerEvents$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    router = TestBed.inject(Router);
    Object.defineProperty(router, 'events', {
      get: () => routerEvents$.asObservable(),
    });
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => '/this-route-does-not-exist',
    });

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('exposes a visually-hidden h1 for screen readers', () => {
    const h1 = el.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.classList.contains('visually-hidden')).toBe(true);
    expect(h1?.textContent).toContain('404');
  });

  it('renders the requested path in the terminal output', () => {
    /*
      The path text is wired off the post-hydration `liveUrl` signal
      (populated by `afterNextRender` from `window.location`) and the
      `NavigationEnd` stream — `router.url` itself is intentionally not
      read synchronously, since under SSR/prerender it would bake the
      wrong path into the static HTML. Replay the mocked URL through
      a `NavigationEnd` to mirror the post-hydration ordering the
      production pipeline produces.
    */
    routerEvents$.next(
      new NavigationEnd(0, '/this-route-does-not-exist', '/this-route-does-not-exist'),
    );
    fixture.detectChanges();

    const body = el.querySelector('.terminal-body')?.textContent ?? '';
    expect(body).toContain('this-route-does-not-exist');
  });

  it('updates the displayed path when a navigation completes', () => {
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => '/different/path',
    });
    routerEvents$.next(new NavigationEnd(1, '/different/path', '/different/path'));
    fixture.detectChanges();

    expect(component['path']()).toBe('different/path');
  });

  it('renders three suggestion cards', () => {
    const cards = el.querySelectorAll('.suggestion-card');
    expect(cards.length).toBe(3);
  });
});
