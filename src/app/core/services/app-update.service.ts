import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { APP_VERSION } from './app-version.generated';

/**
 * Frequency of the build-stamp poll while the tab is open. Five minutes
 * balances "responsive to deploys" against "harmless background traffic" —
 * the request is ~80 bytes, served `Cache-Control: no-cache` from nginx,
 * and the SW dataGroup with `strategy: freshness` revalidates against the
 * network on every fetch.
 */
const POLL_INTERVAL_MS = 5 * 60_000;

/**
 * Detects post-deploy "stale client, fresh server" mismatches and reloads
 * the live tab at the next safe boundary so the user always renders against
 * fresh CSS/JS.
 *
 * Two independent signals feed a single `markPending()` so the reload
 * boundary logic stays one code path:
 *
 *   1. Angular's `SwUpdate.versionUpdates` — fires when the SW finishes
 *      fetching a new ngsw.json and stages the new version. Also handles
 *      `unrecoverable` (catastrophic SW state, e.g. hash collision in the
 *      precache) by clearing every Cache Storage bucket and reloading.
 *
 *   2. Build-time version stamp poll — fetches `/version.json` with
 *      `cache: 'no-store'` and compares the returned `id` against the
 *      `APP_VERSION` baked into the JS bundle at build time. Catches the
 *      cases SwUpdate alone misses: visits shorter than `registerWhenStable`,
 *      browsers with the SW disabled or bypassed, and the rare "SW is itself
 *      stuck on an old manifest" failure mode.
 *
 * Once `pending` flips to true, the service waits for one of:
 *   - The user being idle (`scrollY === 0`) — reload immediately, no flash.
 *   - The next router `NavigationEnd` — the click was already going to swap
 *     pages; we just make it a full document load instead of an SPA route.
 *   - The tab becoming visible again — they switched away anyway, take the
 *     opportunity to swap before they're reading.
 *
 * Inert under SSR (no `window`, no SW) so it's safe to invoke from
 * `provideAppInitializer` regardless of platform.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly sw = inject(SwUpdate);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  private pending = false;
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private visibilityListener: (() => void) | null = null;

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.subscribeToSwUpdates();
    this.subscribeToRouterEvents();
    this.subscribeToVisibilityChanges();
    this.startVersionStampPoll();

    this.destroyRef.onDestroy(() => {
      if (this.pollHandle !== null) clearInterval(this.pollHandle);
      if (this.visibilityListener && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', this.visibilityListener);
      }
    });
  }

  private subscribeToSwUpdates(): void {
    if (!this.sw.isEnabled) return;

    this.sw.versionUpdates.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event.type !== 'VERSION_READY') return;
      // `activateUpdate()` swaps the controller as soon as no clients hold
      // the old version; calling `markPending()` ensures we also reload the
      // current tab — otherwise the new version only takes effect on the
      // next browser-initiated navigation.
      this.sw
        .activateUpdate()
        .catch(() => {
          /* activateUpdate races with the SW's own activation timing; if it
             rejects we still want to reload so the user lands on fresh
             assets — the SW will activate naturally on the next load. */
        })
        .finally(() => this.markPending());
    });

    this.sw.unrecoverable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      void this.purgeAndReload();
    });
  }

  private subscribeToRouterEvents(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.pending) this.reload();
      });
  }

  private subscribeToVisibilityChanges(): void {
    if (typeof document === 'undefined') return;
    this.visibilityListener = () => {
      if (document.visibilityState !== 'visible') return;
      if (this.pending) {
        this.reload();
        return;
      }
      // Re-check the stamp on tab refocus so a user who left the tab
      // open over a deploy gets the new version on their next glance,
      // not after the next 5-minute poll tick.
      void this.checkVersionStamp();
    };
    document.addEventListener('visibilitychange', this.visibilityListener);
  }

  private startVersionStampPoll(): void {
    void this.checkVersionStamp();
    this.pollHandle = setInterval(() => void this.checkVersionStamp(), POLL_INTERVAL_MS);
  }

  private async checkVersionStamp(): Promise<void> {
    if (this.pending) return;
    if (typeof fetch !== 'function') return;

    try {
      const res = await fetch('/version.json', { cache: 'no-store' });
      if (!res.ok) return;
      const body = (await res.json()) as { id?: unknown };
      const id = typeof body.id === 'string' ? body.id : null;
      if (!id || id === APP_VERSION) return;

      // Stamp drift detected — try to also bring the SW along so the next
      // navigation's precache hits land on the new manifest. Failures here
      // are non-fatal; the reload alone is enough to fix the user-visible
      // CSS staleness.
      if (this.sw.isEnabled) {
        try {
          const found = await this.sw.checkForUpdate();
          if (found) await this.sw.activateUpdate();
        } catch {
          /* swallow — a stamp mismatch is a sufficient signal on its own */
        }
      }
      this.markPending();
    } catch {
      /* offline, 404, or aborted — try again next tick */
    }
  }

  private markPending(): void {
    if (this.pending) return;
    this.pending = true;
    if (this.userIsIdle()) this.reload();
  }

  /**
   * "Idle" here is a deliberate proxy for "the user isn't visibly engaged
   * with the page yet" — if `scrollY === 0` the reader hasn't even started
   * reading, so a transparent reload is invisible to them. Anything else
   * (any scroll position, mid-form, mid-selection) defers to a navigation
   * boundary so we never yank content out from under them.
   */
  private userIsIdle(): boolean {
    return typeof window !== 'undefined' && window.scrollY === 0;
  }

  private reload(): void {
    if (typeof window === 'undefined') return;
    window.location.reload();
  }

  private async purgeAndReload(): Promise<void> {
    if (typeof window === 'undefined') return;
    if ('caches' in window) {
      try {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      } catch {
        /* if Cache Storage rejects we still reload — the new SW activation
           will eventually purge stale entries on its own. */
      }
    }
    this.reload();
  }
}
