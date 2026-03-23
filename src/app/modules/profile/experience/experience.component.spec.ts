import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZoneChangeDetection } from '@angular/core';

import { ExperienceComponent } from './experience.component';

describe('ExperienceComponent', () => {
  let component: ExperienceComponent;
  let fixture: ComponentFixture<ExperienceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true })
      ],
      imports: [ExperienceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
