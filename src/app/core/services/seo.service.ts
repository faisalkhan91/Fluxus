import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { yearsOfExperience } from '../../shared/utils/career.utils';

const SITE_NAME = 'Faisal Khan | Senior Software Engineer';
const DEFAULT_DESCRIPTION = `Senior Software Engineer with ${yearsOfExperience()}+ years of experience in Full-Stack Development, Cloud Architecture, AI, and DevOps.`;

@Injectable({ providedIn: 'root' })
export class SeoService {
  private router = inject(Router);
  private title = inject(Title);
  private meta = inject(Meta);
  private destroyRef = inject(DestroyRef);

  init(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        let route = this.router.routerState.root;
        while (route.firstChild) {
          route = route.firstChild;
        }

        const seo = route.snapshot.data?.['seo'];
        if (seo?.['dynamicMeta']) return;

        const pageTitle = seo?.['title'] ? `${seo['title']} — ${SITE_NAME}` : SITE_NAME;
        const description = seo?.['description'] ?? DEFAULT_DESCRIPTION;

        this.title.setTitle(pageTitle);
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ property: 'og:title', content: pageTitle });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:type', content: 'website' });
        this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
      });
  }
}
