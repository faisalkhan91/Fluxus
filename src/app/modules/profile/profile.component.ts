import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { HeaderComponent } from '../../core/header/header.component';
import { OverviewComponent } from './overview/overview.component';
import { ExperienceComponent } from './experience/experience.component';
import { SkillsComponent } from './skills/skills.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { AchievementsComponent } from './achievements/achievements.component';
import { InterestsComponent } from './interests/interests.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [
    NgOptimizedImage,
    HeaderComponent,
    OverviewComponent,
    ExperienceComponent,
    SkillsComponent,
    PortfolioComponent,
    AchievementsComponent,
    InterestsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  currentToggle = signal<string>('overview');

  profileToggleFunction(toggleVal: string) {
    this.currentToggle.set(toggleVal);
  }
}
