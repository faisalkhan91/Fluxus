import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GlowButtonComponent } from '../../ui/glow-button/glow-button.component';
import { GlassCardComponent } from '../../ui/glass-card/glass-card.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { ProfileDataService } from '../../core/services/profile-data.service';
import { BlogService } from '../../core/services/blog.service';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  imports: [RouterLink, GlowButtonComponent, GlassCardComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent implements OnInit {
  protected profile = inject(ProfileDataService);
  protected blog = inject(BlogService);

  ngOnInit(): void {
    this.blog.loadPosts();
  }
}
