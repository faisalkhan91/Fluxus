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
/**
 * SSR-safe capability check for `window.matchMedia`. Returns `false` under
 * SSR / non-browser execution. Shared by `prefersReducedMotion` here and by
 * `MediaQueryService` so the guard can't drift between the two.
 */
export function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

export function prefersReducedMotion(): boolean {
  return hasMatchMedia() && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (callback: () => void) => unknown;
};

/**
 * Apply `mutate` inside the View Transitions API when the browser
 * supports it AND the user hasn't requested reduced motion; otherwise
 * apply it instantly. Centralises the capability-check + reduced-motion
 * gate that theme.service.ts and skills.component.ts each open-coded
 * identically (signal-driven swaps that Angular's route-level
 * `withViewTransitions()` doesn't cover).
 *
 * SSR-safe: a non-browser document doesn't expose `startViewTransition`,
 * so the instant path runs — no `isPlatformBrowser` guard is needed at
 * the callsite for the transition decision itself.
 */
export function applyViewTransition(doc: Document, mutate: () => void): void {
  const startViewTransition = (doc as ViewTransitionCapableDocument).startViewTransition;
  if (typeof startViewTransition === 'function' && !prefersReducedMotion()) {
    startViewTransition.call(doc, mutate);
  } else {
    mutate();
  }
}
