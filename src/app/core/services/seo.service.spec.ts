import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { SeoService } from './seo.service';
import { environment } from '../../../environments/environment';

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

  it('should update canonical when navigating to root', async () => {
    await router.navigate(['/']);
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(environment.siteUrl);
  });
});
