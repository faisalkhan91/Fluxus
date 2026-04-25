import { ErrorHandler, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ErrorToastService } from './error-toast.service';
import { environment } from '../../../environments/environment';

/**
 * Cheap structural matcher for "the dynamic import that loads a route chunk
 * failed because the underlying network/CDN went down or because the user is
 * looking at a tab opened before a fresh deploy invalidated the chunk hashes".
 * Catches Vite/Angular CLI shapes across browsers.
 */
function isChunkLoadFailure(err: unknown): boolean {
  if (!err) return false;
  const message = err instanceof Error ? err.message : String((err as { message?: unknown }).message ?? err);
  return /chunk|loading|dynamically imported module|Failed to fetch/i.test(message);
}

/**
 * Single shared ErrorHandler. Logs once to the console (so the existing
 * provideBrowserGlobalErrorListeners() Angular surfacing isn't lost) and
 * surfaces a recovery toast for chunk-load failures. Roadmap B11 plugs Sentry
 * in here behind an environment.production gate.
 */
interface SentryShape {
  init(options: { dsn: string; environment?: string; tracesSampleRate?: number }): void;
  captureException(err: unknown): void;
}

@Injectable({ providedIn: 'root' })
export class AppErrorHandler implements ErrorHandler {
  private toasts = inject(ErrorToastService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private sentryReady = false;

  constructor() {
    // Sentry is loaded lazily so the bundle stays clean for visitors who
    // never hit an error. Activates only when:
    //   - we're in a real browser (not SSR),
    //   - this is a production build,
    //   - the user has wired a DSN into environment.sentryDsn,
    //   - and the @sentry/browser package is actually installed.
    if (this.isBrowser && environment.production && environment.sentryDsn) {
      void this.initSentry();
    }
  }

  private async initSentry(): Promise<void> {
    try {
      // Use a string-built specifier so the bundler doesn't try to resolve
      // `@sentry/browser` at build time when the package isn't installed.
      const moduleId = '@sentry' + '/browser';
      const sentryModule = (await import(/* @vite-ignore */ moduleId)) as SentryShape;
      sentryModule.init({
        dsn: environment.sentryDsn,
        environment: 'production',
        tracesSampleRate: 0.1,
      });
      this.sentryReady = true;
      // Keep the reference for handleError().
      (this as unknown as { sentry: SentryShape }).sentry = sentryModule;
    } catch {
      // @sentry/browser isn't installed — degrade silently. Console + toast
      // still work; only remote reporting is skipped.
    }
  }

  handleError(error: unknown): void {
    // Always preserve the default console logging so DevTools still shows the
    // stack trace; Angular's BrowserGlobalErrorListeners stops here otherwise.
    console.error(error);

    if (!this.isBrowser) return;

    if (this.sentryReady) {
      const sentry = (this as unknown as { sentry?: SentryShape }).sentry;
      sentry?.captureException(error);
    }

    if (isChunkLoadFailure(error)) {
      this.toasts.push({
        title: 'A part of the app failed to load',
        detail:
          'This usually happens when a fresh deploy lands while you have the page open. Reloading should fix it.',
        actionLabel: 'Reload',
        action: () => window.location.reload(),
      });
    }
  }
}
