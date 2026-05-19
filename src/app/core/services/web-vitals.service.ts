import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@env/environment';

interface VitalsConfig {
  /**
   * Endpoint that receives the metric beacons. Empty string disables network
   * reporting (we still log to the console in dev).
   */
  endpoint: string;
}

const DEFAULT_CONFIG: VitalsConfig = {
  // Set this to a self-hosted log endpoint or a Cloudflare Worker that writes
  // to your analytics store. Until then, metrics only surface in the console.
  endpoint: '',
};

/*
  How long to wait, at most, before falling back from `requestIdleCallback`
  to `setTimeout`. We don't want to delay vitals registration indefinitely
  on a page that's pinned at "busy" — if no idle window arrives in 2 s we
  just register the observers (the LCP entry has almost certainly landed
  by then on any realistic device).
*/
const IDLE_FALLBACK_MS = 2000;

/*
  Resolved at call-time (not module load) so test setups that patch
  `window.requestIdleCallback` after the module has been imported still
  see their stub. Module-level const capture would freeze us into the
  jsdom default (no `requestIdleCallback` → 2 s `setTimeout`).

  Returns the scheduling handle as a tagged union so callers can cancel
  cleanly — the idle path uses `cancelIdleCallback`, the timeout path
  uses `clearTimeout`, and the SSR no-op path returns null.
*/
type ScheduleHandle =
  | { kind: 'idle'; id: number }
  | { kind: 'timeout'; id: ReturnType<typeof setTimeout> }
  | null;

function scheduleIdle(cb: () => void): ScheduleHandle {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    return {
      kind: 'idle',
      id: window.requestIdleCallback(() => cb(), { timeout: IDLE_FALLBACK_MS }),
    };
  }
  if (typeof setTimeout === 'undefined') return null;
  return { kind: 'timeout', id: setTimeout(cb, IDLE_FALLBACK_MS) };
}

/**
 * Field telemetry for Core Web Vitals (CLS, INP, LCP, FCP, TTFB). Metrics
 * are logged to the console in development for visibility, and beaconed to
 * `endpoint` in production when configured.
 *
 * The implementation lazily imports `web-vitals` so SSR / non-browser bundles
 * never pay for the parse cost, and schedules registration via
 * `requestIdleCallback` so the dynamic import network/parse work doesn't
 * compete with the Largest Contentful Paint on bootstrap.
 */
@Injectable({ providedIn: 'root' })
export class WebVitalsService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private config = DEFAULT_CONFIG;
  private started = false;
  /**
   * Pending idle / timeout handle from `scheduleIdle`. The public
   * `cancel()` method below uses this to drop a not-yet-fired
   * registration so a test fixture or HMR re-init can replay
   * `start()` without doubling the `PerformanceObserver` setup.
   */
  private idleHandle: ScheduleHandle = null;

  start(overrides: Partial<VitalsConfig> = {}): void {
    if (!this.isBrowser || this.started) return;
    this.started = true;
    this.config = { ...DEFAULT_CONFIG, ...overrides };

    /*
      The web-vitals registration itself is small, but the dynamic import
      pulls a ~3 KB chunk and runs `PerformanceObserver` setup that briefly
      contests main-thread time. We push the entire bring-up onto an idle
      callback so it lands strictly *after* the LCP frame has had its shot
      at the main thread — `requestIdleCallback` is guaranteed not to fire
      during a long-task window. The 2 s timeout floor is the WCAG-friendly
      cap: even a permanently-busy page registers vitals within 2 s, which
      still captures every vitals metric (LCP, CLS, INP) since they all
      observe events that occur *after* registration via buffered entries.
    */
    this.idleHandle = scheduleIdle(() => {
      this.idleHandle = null;
      void this.register();
    });
  }

  /**
   * Drop any pending idle / timeout registration and reset the
   * `started` guard so a subsequent `start()` call can re-schedule.
   * Intended for test setups that re-create the singleton between
   * cases and for HMR cycles in dev — production code should never
   * call this. After `register()` has actually fired the
   * PerformanceObservers cannot be unregistered through this path
   * (web-vitals doesn't expose a `disable` API); the cancel only
   * affects the not-yet-started bring-up window.
   */
  cancel(): void {
    if (this.idleHandle === null) {
      this.started = false;
      return;
    }
    if (typeof window !== 'undefined') {
      if (this.idleHandle.kind === 'idle') {
        const w = window as Window & { cancelIdleCallback?: (id: number) => void };
        w.cancelIdleCallback?.(this.idleHandle.id);
      } else {
        clearTimeout(this.idleHandle.id);
      }
    }
    this.idleHandle = null;
    this.started = false;
  }

  private async register(): Promise<void> {
    const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals');
    const sink = (metric: { name: string; value: number; id: string; rating?: string }) => {
      if (!environment.production) {
        console.info(
          `[web-vitals] ${metric.name}=${metric.value.toFixed(2)} (${metric.rating ?? 'n/a'})`,
        );
      }
      if (this.config.endpoint && typeof navigator.sendBeacon === 'function') {
        const payload = JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          rating: metric.rating,
          path: location.pathname,
          ts: Date.now(),
        });
        try {
          navigator.sendBeacon(this.config.endpoint, payload);
        } catch {
          // best-effort; ignored.
        }
      }
    };

    onCLS(sink);
    onINP(sink);
    onLCP(sink);
    onFCP(sink);
    onTTFB(sink);
  }
}
