/**
 * Returns true when the user has asked for reduced motion. Centralises
 * the SSR-safe `matchMedia` check that was previously duplicated across
 * theme.service.ts, blog-post.component.ts, skills.component.ts, and
 * hero.component.ts — all four callsites guarded against undefined
 * `window` and missing `matchMedia` with the same boilerplate, and
 * a future drift would be silent.
 *
 * Returns `false` under SSR / non-browser execution since a server
 * cannot honour a per-client motion preference; let the client tier
 * make the call once the preference is reachable.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
