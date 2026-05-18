import { ErrorHandler, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ErrorToastService } from './error-toast.service';
import { environment } from '@env/environment';

/**
 * Cheap structural matcher for "the dynamic import that loads a route chunk
 * failed because the underlying network/CDN went down or because the user is
 * looking at a tab opened before a fresh deploy invalidated the chunk hashes".
 * Matches specific chunk-load error shapes from Vite / webpack / Angular CLI —
 * a bare "loading" token is intentionally NOT matched because it collides with
 * NgOptimizedImage diagnostics, hydration warnings, and other routine Angular
 * messages that would otherwise spam the recovery toast on every re-render.
 */
function isChunkLoadFailure(err: unknown): boolean {
  if (!err) return false;
  const message =
    err instanceof Error ? err.message : String((err as { message?: unknown }).message ?? err);
  return /ChunkLoadError|Loading chunk\b|dynamically imported module|Failed to fetch/i.test(
    message,
  );
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
  /**
   * Lazy-loaded Sentry module. Declared as a typed optional field so
   * the assignment at the end of `initSentry()` doesn't need a
   * `(this as unknown as { sentry })` double cast — the previous shape
   * sidestepped TypeScript's class-member checking and would silently
   * accept a divergent `SentryShape` definition.
   */
  private sentry?: SentryShape;

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
      this.sentry = sentryModule;
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

    this.sentry?.captureException(error);

    if (isChunkLoadFailure(error)) {
      this.toasts.push({
        // Chunk-load failure interrupts the user's flow (the route they
        // navigated to is broken until they reload), so this is the rare
        // case that genuinely warrants `role="alert"` (assertive).
        severity: 'error',
        title: 'A part of the app failed to load',
        detail:
          'This usually happens when a fresh deploy lands while you have the page open. Reloading should fix it.',
        actionLabel: 'Reload',
        action: () => window.location.reload(),
      });
    }
  }
}
