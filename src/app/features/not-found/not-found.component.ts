import {
  Component,
  ChangeDetectionStrategy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { IconComponent } from '@ui/icon/icon.component';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
})
export class NotFoundComponent {
  private router = inject(Router);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /*
    Path text shown in the simulated `curl` / `grep` lines of the terminal
    body. Two motivations for the indirection rather than reading
    `router.url` synchronously:

    1. Under SSR / `RenderMode.Server`, `router.url` is the request path
       at the moment the server router resolves the route, but the
       prerender pipeline used to set this to `'/'` for the catch-all,
       which baked an empty `curl -I /` line into the prerendered HTML
       and then hydration patched it on the client (a visible content
       swap on the most prominent line of the page).
    2. Even with the SSR fix, snapshot-style rendering benefits from a
       deterministic placeholder until the browser path is known. We
       seed the signal with `''` and write it from `Document.location`
       inside `afterNextRender` so the first paint is stable and the
       client-side update happens once, post-hydration.

    Subsequent in-app navigations (rare for a 404 — usually the user
    leaves), still need to refresh the displayed path; we still listen
    to `NavigationEnd` for that.
  */
  private liveUrl = signal('');

  private routerUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      takeUntilDestroyed(),
    ),
    { initialValue: '' },
  );

  protected readonly path = computed(() => {
    const url = this.routerUrl() || this.liveUrl();
    if (!url) return '';
    return url.replace(/^\//, '').split('?')[0];
  });

  /** Truthy under SSR _and_ before the live URL has been read. */
  protected readonly hasPath = computed(() => this.path().length > 0);

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) return;
      try {
        const path = window.location.pathname + window.location.search;
        this.liveUrl.set(path);
      } catch {
        // Browser refused to expose location (sandboxed iframe etc.) —
        // leave the placeholder in place; the simulated terminal still
        // tells the story without the path.
      }
    });
  }
}
