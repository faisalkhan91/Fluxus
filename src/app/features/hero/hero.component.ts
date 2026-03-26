import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GlowButtonComponent } from '../../ui/glow-button/glow-button.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { ProfileDataService } from '../../core/services/profile-data.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  imports: [RouterLink, GlowButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  protected profile = inject(ProfileDataService);
}
