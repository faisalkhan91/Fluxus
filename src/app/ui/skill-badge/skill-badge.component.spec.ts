import { describe, it, expect, beforeEach } from 'vitest';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SkillBadgeComponent } from './skill-badge.component';

describe('SkillBadgeComponent', () => {
  let fixture: ComponentFixture<SkillBadgeComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillBadgeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SkillBadgeComponent);
    el = fixture.nativeElement;
  });

  it('renders the skill name', () => {
    fixture.componentRef.setInput('name', 'TypeScript');
    fixture.detectChanges();
    expect(el.querySelector('.badge-name')?.textContent?.trim()).toBe('TypeScript');
  });

  it('omits the icon img when iconSrc is undefined', () => {
    fixture.componentRef.setInput('name', 'Go');
    fixture.detectChanges();
    expect(el.querySelector('.badge-icon')).toBeNull();
  });

  it('renders the icon img with ngSrc + alt when iconSrc is provided', () => {
    fixture.componentRef.setInput('name', 'Angular');
    fixture.componentRef.setInput('iconSrc', '/assets/icons/angular.svg');
    fixture.detectChanges();

    const img = el.querySelector('img.badge-icon') as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img?.alt).toBe('Angular');
    expect(img?.getAttribute('src') ?? img?.src ?? '').toContain('angular.svg');
  });

  describe('tagline', () => {
    it('surfaces the tagline via the native title attribute', () => {
      fixture.componentRef.setInput('name', 'Python');
      fixture.componentRef.setInput('tagline', 'Primary backend language.');
      fixture.detectChanges();
      const inner = el.querySelector('.badge-inner') as HTMLElement;
      expect(inner.getAttribute('title')).toBe('Primary backend language.');
    });

    it('omits the title attribute when no tagline is supplied', () => {
      fixture.componentRef.setInput('name', 'Quiet');
      fixture.detectChanges();
      const inner = el.querySelector('.badge-inner') as HTMLElement;
      expect(inner.getAttribute('title')).toBeNull();
    });
  });

  describe('link + captions', () => {
    it('renders only the inner card (no anchor) when href is omitted', () => {
      fixture.componentRef.setInput('name', 'Static');
      fixture.detectChanges();
      expect(el.querySelector('.badge-inner-link')).toBeNull();
      expect(el.querySelector('a.badge-card-link')).toBeNull();
    });

    it('renders the projects caption as the card-wide link when href is set', () => {
      fixture.componentRef.setInput('name', 'Rust');
      fixture.componentRef.setInput('href', '/projects/tag/rust');
      fixture.componentRef.setInput('projectsCount', 3);
      fixture.detectChanges();

      const inner = el.querySelector('.badge-inner-link');
      expect(inner).not.toBeNull();
      const link = el.querySelector('a.badge-card-link') as HTMLAnchorElement | null;
      expect(link).not.toBeNull();
      // RouterLink writes the resolved URL to the href attribute; the
      // rendered text gives users the count.
      expect(link?.getAttribute('href')).toBe('/projects/tag/rust');
      expect(link?.textContent?.trim()).toBe('3 projects');
    });

    it('uses the singular form for projectsCount === 1', () => {
      fixture.componentRef.setInput('name', 'Solo');
      fixture.componentRef.setInput('href', '/projects/tag/solo');
      fixture.componentRef.setInput('projectsCount', 1);
      fixture.detectChanges();
      expect(el.querySelector('a.badge-card-link')?.textContent?.trim()).toBe('1 project');
    });

    it('renders an empty captions wrapper when both counts are 0 so cards align vertically', () => {
      fixture.componentRef.setInput('name', 'Quiet');
      fixture.detectChanges();
      // Wrapper is always rendered so its `min-height` keeps the
      // footer y-position consistent across tiles that do and do not
      // carry pills; the pill content is gated per count.
      const captions = el.querySelector('.badge-captions');
      expect(captions).not.toBeNull();
      expect(captions?.querySelector('.badge-caption')).toBeNull();
      expect(captions?.querySelector('.badge-caption-link')).toBeNull();
    });

    it('renders the posts caption as a separate anchor when postsHref is set', () => {
      fixture.componentRef.setInput('name', 'Rust');
      fixture.componentRef.setInput('href', '/projects/tag/rust');
      fixture.componentRef.setInput('postsHref', '/blog/tag/rust');
      fixture.componentRef.setInput('projectsCount', 3);
      fixture.componentRef.setInput('postsCount', 2);
      fixture.detectChanges();

      const links = el.querySelectorAll('a.badge-caption-link');
      expect(links.length).toBe(2);
      const postsLink = Array.from(links).find(
        (a) => (a as HTMLAnchorElement).getAttribute('href') === '/blog/tag/rust',
      ) as HTMLAnchorElement | undefined;
      expect(postsLink).toBeDefined();
      expect(postsLink?.textContent?.trim()).toBe('2 posts');
    });

    it('renders the posts caption as plain text when postsHref is omitted', () => {
      fixture.componentRef.setInput('name', 'Rust');
      fixture.componentRef.setInput('href', '/projects/tag/rust');
      fixture.componentRef.setInput('projectsCount', 3);
      fixture.componentRef.setInput('postsCount', 1);
      fixture.detectChanges();
      // Only the projects-caption is a link; the posts pill falls back
      // to a plain <span> so we never render an anchor with an empty
      // href.
      const links = el.querySelectorAll('a.badge-caption-link');
      expect(links.length).toBe(1);
      const postsSpan = Array.from(el.querySelectorAll('.badge-caption')).find((e) =>
        (e.textContent ?? '').includes('1 post'),
      );
      expect(postsSpan?.tagName).toBe('SPAN');
    });

    it('exposes a screen-reader-friendly label on the projects link', () => {
      fixture.componentRef.setInput('name', 'Rust');
      fixture.componentRef.setInput('href', '/projects/tag/rust');
      fixture.componentRef.setInput('projectsCount', 3);
      fixture.detectChanges();
      const link = el.querySelector('a.badge-card-link') as HTMLAnchorElement;
      expect(link.getAttribute('aria-label')).toBe('Rust — view 3 projects');
    });

    it('keeps the captions row in the DOM with both pills present so the hover-reveal has something to fade in', () => {
      // Regression guard for the hover-reveal contract: the pills are
      // hidden via CSS opacity, not by gating the DOM. Rendering them
      // unconditionally is what lets the row reserve its min-height
      // at rest so the reveal causes zero layout shift.
      fixture.componentRef.setInput('name', 'Rust');
      fixture.componentRef.setInput('href', '/projects/tag/rust');
      fixture.componentRef.setInput('postsHref', '/blog/tag/rust');
      fixture.componentRef.setInput('projectsCount', 1);
      fixture.componentRef.setInput('postsCount', 2);
      fixture.detectChanges();
      const captions = el.querySelector('.badge-captions') as HTMLElement;
      expect(captions).not.toBeNull();
      expect(captions.querySelectorAll('.badge-caption').length).toBe(2);
    });
  });
});
