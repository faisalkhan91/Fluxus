import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { SeoService } from './seo.service';
import { environment } from '@env/environment';

@Component({ template: '' })
class DummyComponent {}

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;
  let document: Document;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'about',
            component: DummyComponent,
            data: {
              seo: {
                title: 'About',
                description: 'About page description',
              },
            },
          },
          {
            path: 'blog',
            component: DummyComponent,
            data: {
              seo: { dynamicMeta: true },
            },
          },
          { path: '', component: DummyComponent },
        ]),
      ],
    });

    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    document = TestBed.inject(DOCUMENT);
    router = TestBed.inject(Router);

    service.init();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set page title with site name on navigation', async () => {
    await router.navigate(['/about']);
    expect(titleService.getTitle()).toContain('About');
    expect(titleService.getTitle()).toContain(environment.siteName);
  });

  it('should set default title when no seo data', async () => {
    await router.navigate(['/']);
    expect(titleService.getTitle()).toBe(environment.siteName);
  });

  it('should skip meta update for routes with dynamicMeta', async () => {
    const originalTitle = titleService.getTitle();
    await router.navigate(['/blog']);
    expect(titleService.getTitle()).toBe(originalTitle);
  });

  it('should set canonical, og:url, og:image, and twitter tags on navigation', async () => {
    await router.navigate(['/about']);

    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(`${environment.siteUrl}/about`);

    expect(metaService.getTag('property="og:url"')?.content).toBe(`${environment.siteUrl}/about`);
    expect(metaService.getTag('property="og:image"')?.content).toContain('og-image');
    expect(metaService.getTag('property="og:type"')?.content).toBe('website');
    expect(metaService.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
    expect(metaService.getTag('name="twitter:title"')?.content).toContain('About');
    expect(metaService.getTag('name="twitter:image"')?.content).toContain('og-image');
  });

  it('preserves the trailing slash on the root canonical (matches the prerendered HTML)', async () => {
    await router.navigate(['/']);
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(`${environment.siteUrl}/`);
  });

  it('clears any prior robots tag on every navigation, even into dynamicMeta routes', async () => {
    // Simulates a user who lands on a draft post (BlogPostSeoService set
    // noindex,nofollow) and then navigates onward. Without the reset in
    // SeoService.init(), the noindex tag stays stuck on the document and
    // crawlers de-index the next page they see.
    service.setRobots('noindex,nofollow');
    expect(document.head.querySelector('meta[name="robots"]')).not.toBeNull();

    await router.navigate(['/about']);
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();

    // Same invariant on a dynamicMeta route — the early-return must not
    // skip the clear, otherwise leaving a draft post for `/blog/<list>`
    // would leak the same way.
    service.setRobots('noindex,nofollow');
    await router.navigate(['/blog']);
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  describe('setLinkRel / removeLinkRel', () => {
    afterEach(() => {
      // Each test inserts <link rel="..."> tags into the live document
      // head; clean them out so they don't leak across cases.
      for (const rel of ['prev', 'next', 'alternate']) {
        document.head.querySelector(`link[rel="${rel}"]`)?.remove();
      }
    });

    it('inserts a new <link rel="..."> when none is present', () => {
      service.setLinkRel('prev', 'https://example.com/a');
      const link = document.head.querySelector<HTMLLinkElement>('link[rel="prev"]');
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('https://example.com/a');
    });

    it('overwrites the existing href when called twice with the same rel', () => {
      service.setLinkRel('prev', 'https://example.com/a');
      service.setLinkRel('prev', 'https://example.com/b');
      const links = document.head.querySelectorAll<HTMLLinkElement>('link[rel="prev"]');
      // No duplicate <link> emitted — same node, updated href.
      expect(links).toHaveLength(1);
      expect(links[0].getAttribute('href')).toBe('https://example.com/b');
    });

    it('removes the link when href is null', () => {
      service.setLinkRel('prev', 'https://example.com/a');
      service.setLinkRel('prev', null);
      expect(document.head.querySelector('link[rel="prev"]')).toBeNull();
    });

    it('removeLinkRel deletes the matching link if present', () => {
      service.setLinkRel('next', 'https://example.com/b');
      service.removeLinkRel('next');
      expect(document.head.querySelector('link[rel="next"]')).toBeNull();
    });

    it('removeLinkRel is a no-op when the link is absent', () => {
      // Sanity: starting state has no rel="alternate" link.
      expect(document.head.querySelector('link[rel="alternate"]')).toBeNull();
      // Should not throw, should not insert anything.
      expect(() => service.removeLinkRel('alternate')).not.toThrow();
      expect(document.head.querySelector('link[rel="alternate"]')).toBeNull();
    });

    it('manages the prev / next pair independently', () => {
      service.setLinkRel('prev', 'https://example.com/a');
      service.setLinkRel('next', 'https://example.com/c');
      expect(document.head.querySelector('link[rel="prev"]')?.getAttribute('href')).toBe(
        'https://example.com/a',
      );
      expect(document.head.querySelector('link[rel="next"]')?.getAttribute('href')).toBe(
        'https://example.com/c',
      );

      // Clearing prev leaves next intact.
      service.setLinkRel('prev', null);
      expect(document.head.querySelector('link[rel="prev"]')).toBeNull();
      expect(document.head.querySelector('link[rel="next"]')?.getAttribute('href')).toBe(
        'https://example.com/c',
      );
    });
  });

  describe('setRobots', () => {
    afterEach(() => {
      document.head.querySelector('meta[name="robots"]')?.remove();
    });

    it('inserts a new <meta name="robots"> when called with a content string', () => {
      service.setRobots('noindex,nofollow');
      const meta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      expect(meta?.getAttribute('content')).toBe('noindex,nofollow');
    });

    it('overwrites the content when called twice', () => {
      service.setRobots('noindex');
      service.setRobots('noindex,nofollow,noarchive');
      const metas = document.head.querySelectorAll<HTMLMetaElement>('meta[name="robots"]');
      expect(metas).toHaveLength(1);
      expect(metas[0].getAttribute('content')).toBe('noindex,nofollow,noarchive');
    });

    it('removes the tag when called with null', () => {
      service.setRobots('noindex');
      service.setRobots(null);
      expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    });

    it('null is a no-op when no robots tag exists', () => {
      expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
      expect(() => service.setRobots(null)).not.toThrow();
      expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    });
  });
});
