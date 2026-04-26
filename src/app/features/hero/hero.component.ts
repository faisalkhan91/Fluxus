import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GlowButtonComponent } from '@ui/glow-button/glow-button.component';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { ProfileDataService } from '@core/services/profile-data.service';
import { BlogService } from '@core/services/blog.service';
import { formatPostDate } from '@shared/utils/blog.utils';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  imports: [RouterLink, GlowButtonComponent, GlassCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  protected profile = inject(ProfileDataService);
  protected blog = inject(BlogService);

  constructor() {
    /*
      Pointer-driven ambient effects. We update two CSS custom properties
      (`--pointer-x`, `--pointer-y`, both 0–1 floats) on the host element
      from a single rAF-batched `pointermove` listener. CSS reads them to:

        - Translate the two ambient glow orbs (parallax depth cue).
        - Position a faint accent radial gradient (`.hero-spotlight`) under
          the cursor.

      Two guards keep the effect honest:
        - SSR-safe: the listener only attaches under `afterNextRender`
          inside `isPlatformBrowser`.
        - Coarse-pointer / reduced-motion: skip entirely. Touch users get
          no benefit, and motion-sensitive users get a static hero.
    */
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const host = this.host.nativeElement as HTMLElement;
      let raf = 0;
      let pendingX = 0.5;
      let pendingY = 0.5;
      let activated = false;

      const flush = () => {
        raf = 0;
        host.style.setProperty('--pointer-x', pendingX.toFixed(3));
        host.style.setProperty('--pointer-y', pendingY.toFixed(3));
        if (!activated) {
          activated = true;
          host.dataset['pointerActive'] = 'true';
        }
      };

      const onPointerMove = (event: PointerEvent) => {
        pendingX = event.clientX / window.innerWidth;
        pendingY = event.clientY / window.innerHeight;
        if (raf) return;
        raf = requestAnimationFrame(flush);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('pointermove', onPointerMove);
        if (raf) cancelAnimationFrame(raf);
      });
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  protected formatDate(iso: string): string {
    return formatPostDate(iso);
  }
}
