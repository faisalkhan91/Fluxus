import type { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

/**
 * A signal of a lowercased, allow-listed query-param value, falling back to
 * `fallback` when the param is absent or not in `allowed`. Mirrors the
 * `?sort=` / `?view=` reads in ProjectsComponent so a choice survives refresh
 * and share-links. Call from an injection context (field initializer) — it
 * uses `toSignal` under the hood.
 */
export function queryParamSignal<T extends string>(
  route: ActivatedRoute,
  key: string,
  allowed: readonly T[],
  fallback: T,
): Signal<T> {
  return toSignal(
    route.queryParamMap.pipe(
      map((q): T => {
        const raw = (q.get(key) ?? '').toLowerCase() as T;
        return allowed.includes(raw) ? raw : fallback;
      }),
    ),
    { initialValue: fallback },
  );
}

/**
 * Merge a single query param into the current URL (`replaceUrl`, so it
 * doesn't stack history entries). Pass `null` to scrub the param — used to
 * keep the URL clean when a control returns to its default value.
 */
export function setQueryParam(
  router: Router,
  route: ActivatedRoute,
  key: string,
  value: string | null,
): void {
  router.navigate([], {
    relativeTo: route,
    queryParams: { [key]: value },
    queryParamsHandling: 'merge',
    replaceUrl: true,
  });
}
