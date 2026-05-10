import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SkillBadgeComponent } from './skill-badge.component';

describe('SkillBadgeComponent', () => {
  let fixture: ComponentFixture<SkillBadgeComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillBadgeComponent],
      // RouterLink in the template needs an injector with the router
      // tree, even when we only assert on the rendered href attribute.
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
    // NgOptimizedImage rewrites the src attribute at runtime — just confirm
    // the filename segment made it through rather than checking the literal.
    expect(img?.getAttribute('src') ?? img?.src ?? '').toContain('angular.svg');
  });

  it('omits the progress bar when level is undefined or 0', () => {
    fixture.componentRef.setInput('name', 'Rust');
    fixture.detectChanges();
    expect(el.querySelector('.badge-bar')).toBeNull();

    fixture.componentRef.setInput('level', 0);
    fixture.detectChanges();
    expect(el.querySelector('.badge-bar')).toBeNull();
  });

  it('renders a progressbar with ARIA attributes when level > 0', () => {
    fixture.componentRef.setInput('name', 'Python');
    fixture.componentRef.setInput('level', 75);
    fixture.detectChanges();

    const bar = el.querySelector('.badge-bar');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('role')).toBe('progressbar');
    expect(bar?.getAttribute('aria-valuenow')).toBe('75');
    expect(bar?.getAttribute('aria-valuemin')).toBe('0');
    expect(bar?.getAttribute('aria-valuemax')).toBe('100');
  });

  it('sets --badge-fill-scale to match the level percentage', () => {
    fixture.componentRef.setInput('name', 'Docker');
    fixture.componentRef.setInput('level', 100);
    fixture.detectChanges();

    const fill = el.querySelector('.badge-fill') as HTMLElement | null;
    expect(fill).not.toBeNull();
    /*
      The fill rail is always 100% wide; its visible length is driven by
      `transform: scaleX(var(--badge-fill-scale))`. Assert the custom
      property the component sets, which is what the CSS reads.
    */
    expect(fill?.style.getPropertyValue('--badge-fill-scale')).toBe('1');
  });

  it('scales --badge-fill-scale proportionally below 100%', () => {
    fixture.componentRef.setInput('name', 'Docker');
    fixture.componentRef.setInput('level', 75);
    fixture.detectChanges();

    const fill = el.querySelector('.badge-fill') as HTMLElement | null;
    expect(fill?.style.getPropertyValue('--badge-fill-scale')).toBe('0.75');
  });

  describe('link + captions', () => {
    it('renders only the inner card (no anchor) when href is omitted', () => {
      fixture.componentRef.setInput('name', 'Static');
      fixture.detectChanges();
      // The wrapper carries the link-mode class only when href is set.
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
      // RouterLink writes the resolved URL to the href attribute when
      // a router is provided; the rendered text gives users the count.
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
      // The wrapper always renders so its reserved `min-height` keeps a
      // usage-less badge the same height as its bar-ful / caption-ful
      // row peers; the pill content is still conditionally rendered.
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
      // Only the projects-caption is a link in this case; the posts pill
      // falls back to a plain <span> so we don't render an anchor with
      // an empty href.
      const links = el.querySelectorAll('a.badge-caption-link');
      expect(links.length).toBe(1);
      const postsSpan = Array.from(el.querySelectorAll('.badge-caption')).find((el) =>
        (el.textContent ?? '').includes('1 post'),
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
  });
});
