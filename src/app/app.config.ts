import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  provideZonelessChangeDetection,
  inject,
} from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';
import { SeoService } from './core/services/seo.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless is the v21 default (no zone.js polyfill is loaded), but we
    // declare it explicitly so future contributors don't accidentally
    // re-introduce zone change detection by adding zone.js to polyfills.
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    provideAppInitializer(() => inject(SeoService).init()),
  ],
};
