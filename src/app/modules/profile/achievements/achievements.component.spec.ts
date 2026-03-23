import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';

import { AchievementsComponent } from './achievements.component';

describe('AchievementsComponent', () => {
  let component: AchievementsComponent;
  let fixture: ComponentFixture<AchievementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true })
      ],
      imports: [AchievementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AchievementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
