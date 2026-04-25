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

/**
 * Field telemetry for Core Web Vitals (CLS, INP, LCP, FCP, TTFB). Metrics
 * are logged to the console in development for visibility, and beaconed to
 * `endpoint` in production when configured.
 *
 * The implementation lazily imports `web-vitals` so SSR / non-browser bundles
 * never pay for the parse cost.
 */
@Injectable({ providedIn: 'root' })
export class WebVitalsService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private config = DEFAULT_CONFIG;
  private started = false;

  async start(overrides: Partial<VitalsConfig> = {}): Promise<void> {
    if (!this.isBrowser || this.started) return;
    this.started = true;
    this.config = { ...DEFAULT_CONFIG, ...overrides };

    // Dynamic import keeps the lib out of the initial main chunk.
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
