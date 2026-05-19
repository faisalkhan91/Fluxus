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
        // Canonical URL contract: root keeps its trailing slash, every
        // other route is normalised without one. This matches what
        // `scripts/inject-meta.mjs` bakes into the prerendered HTML at
        // build time, so the SSG canonical and the post-hydration
        // canonical agree exactly. The previous shape stripped the
        // trailing slash on every path (root included), producing two
        // competing canonical signals on the home route across a single
        // session.
        const path = event.urlAfterRedirects;
        const url =
          path === '/' || path === ''
            ? `${environment.siteUrl}/`
            : `${environment.siteUrl}${path}`.replace(/\/$/, '');

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
   * Upsert a `<link rel="<rel>" href="<href>">` entry on the document
   * head, or remove it when `href` is null. Domain-neutral so callers
   * own the rel string ('prev', 'next', 'alternate', etc.) rather than
   * baking blog-specific knowledge into the SEO layer.
   */
  setLinkRel(rel: string, href: string | null): void {
    if (!href) {
      this.removeLinkRel(rel);
      return;
    }
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      head.appendChild(link);
    }
    link.href = href;
  }

  /** Remove a `<link rel="...">` entry if present; no-op otherwise. */
  removeLinkRel(rel: string): void {
    this.document.head.querySelector(`link[rel="${rel}"]`)?.remove();
  }

  /**
   * Upsert (or remove, when `content` is null) the `<meta name="robots">`
   * tag. Used by `BlogPostSeoService` to mark draft / future-dated
   * posts as `noindex,nofollow` on SPA navigation — the prerendered
   * HTML carries the tag from `inject-meta.mjs` at build time, but a
   * client-side route into the same URL bypasses that and would
   * otherwise expose the post to crawlers indexing the live SPA.
   *
   * Domain-neutral so callers own the content string ('noindex',
   * 'noindex,nofollow', 'noindex,nofollow,noarchive', etc.).
   */
  setRobots(content: string | null): void {
    if (content === null) {
      this.meta.removeTag('name="robots"');
      return;
    }
    this.meta.updateTag({ name: 'robots', content });
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
