import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { SkillsComponent } from './skills.component';
import { SkillsDataService } from '../../core/services/skills-data.service';
import { MediaQueryService } from '../../core/services/media-query.service';
import { SkillCategory } from '../../shared/models/skill.model';

const MOCK_CATEGORIES: SkillCategory[] = [
  {
    title: 'Languages & Frameworks',
    skills: [
      { name: 'Python', iconSrc: 'assets/icons/python.svg' },
      { name: 'Go', iconSrc: 'assets/icons/go.svg' },
      { name: 'TypeScript', iconSrc: 'assets/icons/typescript.svg' },
      { name: 'Rust', iconSrc: 'assets/icons/rust.svg' },
      { name: 'Angular', iconSrc: 'assets/icons/angular.svg' },
      { name: 'JavaScript', iconSrc: 'assets/icons/javascript.svg' },
      { name: 'Django', iconSrc: 'assets/icons/django.svg' },
    ],
  },
  {
    title: 'Cloud & Infrastructure',
    skills: [
      { name: 'AWS', iconSrc: 'assets/icons/aws.svg' },
      { name: 'Docker', iconSrc: 'assets/icons/docker.svg' },
    ],
  },
  {
    title: 'CI/CD & DevOps',
    skills: [
      { name: 'GitHub Actions', iconSrc: 'assets/icons/github.svg' },
      { name: 'ArgoCD', iconSrc: 'assets/icons/argocd.svg' },
      { name: 'Git', iconSrc: 'assets/icons/git.svg' },
    ],
  },
  {
    title: 'Data & Storage',
    skills: [
      { name: 'PostgreSQL', iconSrc: 'assets/icons/postgresql.svg' },
      { name: 'Kafka', iconSrc: 'assets/icons/kafka.svg' },
    ],
  },
  {
    title: 'Observability',
    skills: [{ name: 'Datadog', iconSrc: 'assets/icons/datadog.svg' }],
  },
  {
    title: 'AI & LLMs',
    skills: [
      { name: 'OpenAI', iconSrc: 'assets/icons/openai.svg' },
      { name: 'GitHub Copilot', iconSrc: 'assets/icons/copilot.svg' },
      { name: 'AWS Bedrock', iconSrc: 'assets/icons/aws.svg' },
      { name: 'Gemini', iconSrc: 'assets/icons/gemini.svg' },
      { name: 'Cursor', iconSrc: 'assets/icons/cursor.svg' },
      { name: 'Claude Code', iconSrc: 'assets/icons/anthropic.svg' },
    ],
  },
];

const mockSkillsData = {
  categories: signal(MOCK_CATEGORIES),
};

function createMockMediaQuery(mobile = false) {
  return {
    isMobile: signal(mobile),
    isDesktop: signal(!mobile),
    breakpoint: signal(mobile ? 'mobile' : 'wide'),
    isTablet: signal(false),
    showSidebar: signal(!mobile),
    sidebarCollapsed: signal(false),
    showMobileNav: signal(mobile),
  };
}

describe('SkillsComponent', () => {
  let fixture: ComponentFixture<SkillsComponent>;
  let component: SkillsComponent;
  let el: HTMLElement;

  describe('desktop layout', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SkillsComponent],
        providers: [
          { provide: SkillsDataService, useValue: mockSkillsData },
          { provide: MediaQueryService, useValue: createMockMediaQuery(false) },
        ],
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

    it('should render all 6 category sections', () => {
      const sections = el.querySelectorAll('.skill-section');
      expect(sections.length).toBe(6);
    });

    it('should set aria-labelledby with slugified title', () => {
      const section = el.querySelector('.skill-section');
      expect(section?.getAttribute('aria-labelledby')).toBe('skill-languages-frameworks');
    });

    it('should render badge grids for all categories', () => {
      const badgeGrids = el.querySelectorAll('.badge-grid');
      expect(badgeGrids.length).toBe(6);
    });

    it('should show top 5 badges for categories with more than 5 skills', () => {
      const badgeGrids = el.querySelectorAll('.badge-grid');
      expect(badgeGrids[0].querySelectorAll('ui-skill-badge').length).toBe(5);
    });

    it('should show all badges for categories with 5 or fewer skills', () => {
      const badgeGrids = el.querySelectorAll('.badge-grid');
      expect(badgeGrids[1].querySelectorAll('ui-skill-badge').length).toBe(2);
      expect(badgeGrids[4].querySelectorAll('ui-skill-badge').length).toBe(1);
    });

    it('should show expand toggle for categories with more than 5 skills', () => {
      const toggleButtons = el.querySelectorAll('.expand-toggle');
      expect(toggleButtons.length).toBe(2);
      expect(toggleButtons[0].textContent?.trim()).toContain('+ 2 more');
      expect(toggleButtons[1].textContent?.trim()).toContain('+ 1 more');
    });

    it('should not show expand toggle for categories with 5 or fewer skills', () => {
      const sections = el.querySelectorAll('.skill-section');
      const toggleInCloud = sections[1].querySelector('.expand-toggle');
      expect(toggleInCloud).toBeNull();
    });

    it('should expand to show all skills when toggle is clicked', () => {
      const toggleButton = el.querySelector('.expand-toggle') as HTMLButtonElement;
      toggleButton.click();
      fixture.detectChanges();

      const firstGrid = el.querySelectorAll('.badge-grid')[0];
      expect(firstGrid.querySelectorAll('ui-skill-badge').length).toBe(7);
      expect(toggleButton.textContent?.trim()).toBe('Show less');
    });

    it('should collapse back to top 5 when toggle is clicked again', () => {
      const toggleButton = el.querySelector('.expand-toggle') as HTMLButtonElement;
      toggleButton.click();
      fixture.detectChanges();
      toggleButton.click();
      fixture.detectChanges();

      const firstGrid = el.querySelectorAll('.badge-grid')[0];
      expect(firstGrid.querySelectorAll('ui-skill-badge').length).toBe(5);
      expect(toggleButton.textContent?.trim()).toContain('+ 2 more');
    });

    it('should set aria-expanded on toggle button', () => {
      const toggleButton = el.querySelector('.expand-toggle') as HTMLButtonElement;
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

      toggleButton.click();
      fixture.detectChanges();
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('mobile layout', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SkillsComponent],
        providers: [
          { provide: SkillsDataService, useValue: mockSkillsData },
          { provide: MediaQueryService, useValue: createMockMediaQuery(true) },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      fixture = TestBed.createComponent(SkillsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      el = fixture.nativeElement;
    });

    it('should show top 3 badges on mobile for categories with more than 3 skills', () => {
      const badgeGrids = el.querySelectorAll('.badge-grid');
      // "Languages & Frameworks" has 7 skills, should show 3 on mobile
      expect(badgeGrids[0].querySelectorAll('ui-skill-badge').length).toBe(3);
      // "AI & LLMs" has 6 skills, should show 3 on mobile
      expect(badgeGrids[5].querySelectorAll('ui-skill-badge').length).toBe(3);
    });

    it('should show correct hidden count on mobile', () => {
      const toggleButtons = el.querySelectorAll('.expand-toggle');
      // Languages: 7 - 3 = 4 more
      expect(toggleButtons[0].textContent?.trim()).toContain('+ 4 more');
    });

    it('should show all badges for categories with 3 or fewer skills on mobile', () => {
      const badgeGrids = el.querySelectorAll('.badge-grid');
      // "Cloud & Infrastructure" has 2 skills
      expect(badgeGrids[1].querySelectorAll('ui-skill-badge').length).toBe(2);
      // "CI/CD & DevOps" has 3 skills
      expect(badgeGrids[2].querySelectorAll('ui-skill-badge').length).toBe(3);
    });
  });
});
