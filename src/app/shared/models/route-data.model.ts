/**
 * Typed shape of the per-route `data` payload authored in `app.routes.ts` and
 * consumed by `TabService` (editor-tab metadata) and `SeoService` (per-route
 * meta). Angular types `Route['data']` as a loose index signature, so consumers
 * otherwise read it via bracket access (effectively `any`). Casting the read to
 * these interfaces restores type-safety and gives one source for the shape.
 */
export interface RouteTabData {
  /** Tab label shown in the editor tab bar. */
  label: string;
  /** Fake file extension badge (e.g. `.tsx`, `.md`). */
  ext: string;
  /** Accent colour for the tab's file-type dot. */
  color: string;
}

export interface RouteSeoData {
  /** Page title (composed with the site name by `SeoService`). */
  title?: string;
  /** Meta description; falls back to the site default when absent. */
  description?: string;
  /**
   * When true, `SeoService` leaves the per-route meta to the component (tag /
   * detail pages compute title/description/canonical from their own data).
   */
  dynamicMeta?: boolean;
}

export interface RouteData {
  tab?: RouteTabData;
  seo?: RouteSeoData;
}
