import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { SkillsListViewComponent } from './skills-list-view.component';
import { SkillsDataService } from '@core/services/skills-data.service';
import { SkillUsageService } from '@core/services/skill-usage.service';
import type { Skill, SkillCategory } from '@shared/models/skill.model';

/**
 * Unit coverage for the dense list view: row construction from categories +
 * usage (tier derivation, project/post counts, href, group separators) and the
 * tier-label rendering — none of which the parent SkillsComponent spec exercises
 * at the row level.
 */
const CATEGORIES: SkillCategory[] = [
  {
    title: 'Languages',
    skills: [{ name: 'TypeScript' }, { name: 'Rust' }, { name: 'Go' }] as Skill[],
  },
  {
    title: 'Cloud',
    skills: [{ name: 'AWS', tier: 'core' }] as Skill[],
  },
];

// usage keyed by skill name: TypeScript = 3 projects (core) + 1 post + href,
// Rust = 2 projects (working) + href, Go = none (learning, no href),
// AWS = explicit core tier + 1 project + href.
const USAGE: Record<string, { projectsRouteSlug?: string; projects: unknown[]; posts: unknown[] }> =
  {
    TypeScript: { projectsRouteSlug: 'typescript', projects: [1, 2, 3], posts: [1] },
    Rust: { projectsRouteSlug: 'rust', projects: [1, 2], posts: [] },
    Go: { projects: [], posts: [] },
    AWS: { projectsRouteSlug: 'aws', projects: [1], posts: [] },
  };

const mockSkillsData = { categories: signal(CATEGORIES) } as unknown as SkillsDataService;
const mockUsage = {
  usageFor: (skill: Skill) => USAGE[skill.name],
} as unknown as SkillUsageService;

describe('SkillsListViewComponent', () => {
  let fixture: ComponentFixture<SkillsListViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsListViewComponent],
      providers: [
        provideRouter([]),
        { provide: SkillsDataService, useValue: mockSkillsData },
        { provide: SkillUsageService, useValue: mockUsage },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SkillsListViewComponent);
    fixture.detectChanges();
  });

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('tbody tr.skills-row'));
  }
  function cellText(row: HTMLElement, selector: string): string {
    return (row.querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  it('renders one row per skill across all categories, in catalog order', () => {
    const ids = rows().map((r) => r.id);
    expect(ids).toEqual(['skill-typescript', 'skill-rust', 'skill-go', 'skill-aws']);
  });

  it('marks the first row of each category as a group start', () => {
    const groupStarts = rows()
      .filter((r) => r.classList.contains('skills-row--group-start'))
      .map((r) => r.id);
    expect(groupStarts).toEqual(['skill-typescript', 'skill-aws']);
  });

  it('derives tiers from project count and honours an explicit tier override', () => {
    const tier = (id: string) => cellText(rows().find((r) => r.id === id)!, '.tier-pill');
    expect(tier('skill-typescript')).toBe('Core'); // 3 projects
    expect(tier('skill-rust')).toBe('Working'); // 2 projects
    expect(tier('skill-go')).toBe('Learning'); // 0 projects
    expect(tier('skill-aws')).toBe('Core'); // explicit override
  });

  it('renders a routed link only when usage resolves an href, else a plain name span', () => {
    const ts = rows().find((r) => r.id === 'skill-typescript')!;
    const go = rows().find((r) => r.id === 'skill-go')!;
    expect(ts.querySelector('a.row-link')?.getAttribute('href')).toBe('/projects/tag/typescript');
    expect(go.querySelector('a.row-link')).toBeNull();
    expect(cellText(go, '.row-name')).toBe('Go');
  });

  it('shows counts, falling back to an em dash for zero', () => {
    const ts = rows().find((r) => r.id === 'skill-typescript')!;
    const go = rows().find((r) => r.id === 'skill-go')!;
    const counts = (row: HTMLElement) =>
      Array.from(row.querySelectorAll('.col-count')).map((c) => (c.textContent ?? '').trim());
    expect(counts(ts)).toEqual(['3', '1']);
    expect(counts(go)).toEqual(['—', '—']);
  });
});
