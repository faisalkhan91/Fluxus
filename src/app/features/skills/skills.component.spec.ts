import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { SkillsComponent } from './skills.component';
import { SkillsDataService } from '../../core/services/skills-data.service';
import { SkillCategory } from '../../shared/models/skill.model';

const MOCK_CATEGORIES: SkillCategory[] = [
  {
    title: 'Top Skills',
    skills: [
      { name: 'Python', iconSrc: 'assets/icons/python.svg' },
      { name: 'Docker', iconSrc: 'assets/icons/docker.svg' },
    ],
  },
  {
    title: 'Programming Languages',
    subtitle: 'Proficiency',
    skills: [
      { name: 'Python', level: 90 },
      { name: 'Go', level: 75 },
    ],
  },
];

const mockSkillsData = {
  categories: signal(MOCK_CATEGORIES),
};

describe('SkillsComponent', () => {
  let fixture: ComponentFixture<SkillsComponent>;
  let component: SkillsComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsComponent],
      providers: [{ provide: SkillsDataService, useValue: mockSkillsData }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render category sections', () => {
    const sections = el.querySelectorAll('.skill-section');
    expect(sections.length).toBe(2);
  });

  it('should set aria-labelledby with slugified title', () => {
    const section = el.querySelector('.skill-section');
    expect(section?.getAttribute('aria-labelledby')).toBe('skill-top-skills');
  });

  it('should render badge grid for categories with iconSrc', () => {
    const badgeGrid = el.querySelector('.badge-grid');
    expect(badgeGrid).toBeTruthy();
    const badges = badgeGrid?.querySelectorAll('ui-skill-badge');
    expect(badges?.length).toBe(2);
  });

  it('should render bar list for categories without iconSrc', () => {
    const barList = el.querySelector('.bar-list');
    expect(barList).toBeTruthy();
    const bars = barList?.querySelectorAll('.bar-item');
    expect(bars?.length).toBe(2);
  });

  it('should set correct aria-valuenow on progress bars', () => {
    const progressBars = el.querySelectorAll('[role="progressbar"]');
    expect(progressBars[0].getAttribute('aria-valuenow')).toBe('90');
    expect(progressBars[1].getAttribute('aria-valuenow')).toBe('75');
  });

  it('should set correct aria-label on progress bars', () => {
    const progressBars = el.querySelectorAll('[role="progressbar"]');
    expect(progressBars[0].getAttribute('aria-label')).toBe('Python proficiency');
    expect(progressBars[1].getAttribute('aria-label')).toBe('Go proficiency');
  });
});
