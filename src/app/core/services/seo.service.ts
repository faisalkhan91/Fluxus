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
        const url = `${environment.siteUrl}${event.urlAfterRedirects}`.replace(/\/$/, '') || environment.siteUrl;

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

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
