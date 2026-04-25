import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
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

  // Track the live URL so the displayed path stays in sync with router state
  // even if this component is reused across navigations.
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
      takeUntilDestroyed(),
    ),
    { initialValue: this.router.url },
  );

  protected readonly path = computed(() => (this.currentUrl() ?? '/').replace(/^\//, ''));
}
