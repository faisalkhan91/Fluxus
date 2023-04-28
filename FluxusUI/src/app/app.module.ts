import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './core/header/header.component';
import { FooterComponent } from './core/footer/footer.component';
import { ProfileComponent } from './modules/profile/profile.component';
import { HomeComponent } from './modules/home/home.component';
import { OverviewComponent } from './modules/profile/overview/overview.component';
import { ExperienceComponent } from './modules/profile/experience/experience.component';
import { SkillsComponent } from './modules/profile/skills/skills.component';
import { PortfolioComponent } from './modules/profile/portfolio/portfolio.component';
import { InterestsComponent } from './modules/profile/interests/interests.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    ProfileComponent,
    HomeComponent,
    OverviewComponent,
    ExperienceComponent,
    SkillsComponent,
    PortfolioComponent,
    InterestsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
