import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ExperienceComponent } from './experience.component';
import { ExperienceDataService } from '../../core/services/experience-data.service';
import { TimelineItem } from '../../shared/models/experience.model';

const MOCK_ITEMS: TimelineItem[] = [
  { type: 'period', title: 'Acme Corp' },
  {
    type: 'job',
    role: 'Senior Engineer',
    duration: '2022 - Present',
    achievements: ['Shipped feature A', 'Mentored juniors'],
  },
  {
    type: 'job',
    role: 'Engineer',
    duration: '2020 - 2022',
    achievements: ['Built service B'],
  },
];

describe('ExperienceComponent', () => {
  let fixture: ComponentFixture<ExperienceComponent>;
  let component: ExperienceComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceComponent],
      providers: [{ provide: ExperienceDataService, useValue: { items: signal(MOCK_ITEMS) } }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ExperienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('renders an h1 page header titled "Experience"', () => {
    const h1 = el.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Experience');
  });

  it('maps period entries to type "period" and jobs to type "item"', () => {
    const entries = (component as unknown as { timelineEntries: () => { type: string }[] })
      .timelineEntries();
    expect(entries[0].type).toBe('period');
    expect(entries[1].type).toBe('item');
    expect(entries[2].type).toBe('item');
  });

  it('preserves duration and achievements on mapped entries', () => {
    const entries = (
      component as unknown as {
        timelineEntries: () => {
          duration?: string;
          details?: string[];
          subtitle?: string;
        }[];
      }
    ).timelineEntries();
    expect(entries[1].duration).toBe('2022 - Present');
    expect(entries[1].subtitle).toBe('Senior Engineer');
    expect(entries[1].details).toEqual(['Shipped feature A', 'Mentored juniors']);
  });
});
