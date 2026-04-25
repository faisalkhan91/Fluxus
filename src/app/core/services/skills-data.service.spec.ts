import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SkillsDataService } from './skills-data.service';

describe('SkillsDataService', () => {
  let service: SkillsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SkillsDataService);
  });

  it('exposes several skill categories', () => {
    const categories = service.categories();
    expect(categories.length).toBeGreaterThanOrEqual(5);
  });

  it('every category has a title and at least one skill', () => {
    for (const category of service.categories()) {
      expect(category.title).toBeTruthy();
      expect(category.skills.length).toBeGreaterThan(0);
    }
  });

  it('every skill has a name; icons, when present, point at the assets folder', () => {
    for (const category of service.categories()) {
      for (const skill of category.skills) {
        expect(skill.name).toBeTruthy();
        if (skill.iconSrc) {
          expect(skill.iconSrc).toMatch(/^assets\/icons\//);
        }
      }
    }
  });

  it('Observability category includes Datadog and Prometheus', () => {
    const observability = service.categories().find((c) => c.title === 'Observability');
    const names = observability?.skills.map((s) => s.name) ?? [];
    expect(names).toContain('Datadog');
    expect(names).toContain('Prometheus');
  });
});
