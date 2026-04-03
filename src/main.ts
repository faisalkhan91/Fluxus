import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * Main application entry point for the Fluxus portfolio website.
 * This triggers the Angular application bootstrap with standalone component configuration.
 */
bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
