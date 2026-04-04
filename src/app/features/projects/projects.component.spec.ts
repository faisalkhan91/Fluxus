import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ProjectsComponent } from './projects.component';
import { ProjectsDataService } from '../../core/services/projects-data.service';

const MOCK_PROJECTS = [
  {
    title: 'Project Alpha',
    description: 'Alpha description with details.',
    image: 'assets/alpha.png',
    link: 'https://github.com/alpha',
    tags: ['Angular', 'TypeScript'],
    featured: true,
  },
  {
    title: 'Project Beta',
    description: 'Beta description.',
    image: 'assets/beta.png',
    link: 'https://github.com/beta',
    tags: ['Python'],
  },
];

const mockProjectsData = {
  projects: signal(MOCK_PROJECTS),
};

describe('ProjectsComponent', () => {
  let fixture: ComponentFixture<ProjectsComponent>;
  let component: ProjectsComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [{ provide: ProjectsDataService, useValue: mockProjectsData }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render project cards', () => {
    const cards = el.querySelectorAll('.project-card');
    expect(cards.length).toBe(2);
  });

  it('should display project titles', () => {
    const titles = el.querySelectorAll('.project-title');
    expect(titles[0].textContent?.trim()).toBe('Project Alpha');
    expect(titles[1].textContent?.trim()).toBe('Project Beta');
  });

  it('should start with all projects collapsed', () => {
    const buttons = el.querySelectorAll('.read-more-toggle');
    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('should toggle expansion on button click', () => {
    const btn = el.querySelector('.read-more-toggle') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(btn.textContent?.trim()).toContain('Show less');
  });

  it('should collapse on second click', () => {
    const btn = el.querySelector('.read-more-toggle') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.textContent?.trim()).toContain('Read more');
  });

  it('should expand projects independently', () => {
    const buttons = el.querySelectorAll('.read-more-toggle') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('should set aria-controls matching description id', () => {
    const btn = el.querySelector('.read-more-toggle');
    const controlsId = btn?.getAttribute('aria-controls');
    expect(controlsId).toBe('desc-project-alpha');
    const desc = el.querySelector(`#${controlsId}`);
    expect(desc).toBeTruthy();
  });

  it('should render tags', () => {
    const firstCardTags = el.querySelector('.project-card')?.querySelectorAll('.tag');
    expect(firstCardTags?.length).toBe(2);
    expect(firstCardTags?.[0].textContent?.trim()).toBe('Angular');
  });
});
