import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { yearsOfExperience } from '@shared/utils/career.utils';
import { environment } from '@env/environment';

const DEFAULT_DESCRIPTION = `Senior Software Engineer with ${yearsOfExperience()}+ years of experience in Full-Stack Development, Cloud Architecture, AI, and DevOps.`;
const DEFAULT_OG_IMAGE = `${environment.siteUrl}/assets/images/og-image.png`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private router = inject(Router);
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  init(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        let route = this.router.routerState.root;
        while (route.firstChild) {
          route = route.firstChild;
        }

        const seo = route.snapshot.data?.['seo'];
        if (seo?.['dynamicMeta']) return;

        const pageTitle = seo?.['title']
          ? `${seo['title']} - ${environment.siteName}`
          : environment.siteName;
        const description = seo?.['description'] ?? DEFAULT_DESCRIPTION;
        const url =
          `${environment.siteUrl}${event.urlAfterRedirects}`.replace(/\/$/, '') ||
          environment.siteUrl;

        this.title.setTitle(pageTitle);
        this.meta.updateTag({ name: 'description', content: description });

        this.meta.updateTag({ property: 'og:title', content: pageTitle });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:type', content: 'website' });
        this.meta.updateTag({ property: 'og:site_name', content: environment.siteName });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ property: 'og:image', content: DEFAULT_OG_IMAGE });

        this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
        this.meta.updateTag({ name: 'twitter:description', content: description });
        this.meta.updateTag({ name: 'twitter:image', content: DEFAULT_OG_IMAGE });

        this.setCanonical(url);
      });
  }

  /**
   * Upserts `<link rel="canonical" href="...">` on the document head.
   * Public so `dynamicMeta: true` routes (blog-tag, projects-tag,
   * project-detail) can set a route-param-driven canonical themselves
   * instead of duplicating this 9-liner across components.
   */
  setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /**
   * Applies the full dynamic-meta tag set for a `seo: { dynamicMeta: true }`
   * route: page title plus nine `<meta>` tags covering OpenGraph, Twitter
   * Cards, and the basic `name="description"`. Consolidates the same
   * block that blog-post, blog-tag, projects-tag, and project-detail
   * each used to implement by hand. Callers that lack a per-entity
   * image omit the field and get the site-wide OG fallback.
   */
  updateDynamicMeta(input: {
    title: string;
    description: string;
    url: string;
    type: 'website' | 'article';
    image?: string;
  }): void {
    const image = input.image ?? DEFAULT_OG_IMAGE;
    this.title.setTitle(input.title);
    this.meta.updateTag({ name: 'description', content: input.description });
    this.meta.updateTag({ property: 'og:title', content: input.title });
    this.meta.updateTag({ property: 'og:description', content: input.description });
    this.meta.updateTag({ property: 'og:url', content: input.url });
    this.meta.updateTag({ property: 'og:type', content: input.type });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:title', content: input.title });
    this.meta.updateTag({ name: 'twitter:description', content: input.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }
}
