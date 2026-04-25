import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProjectsDataService } from './projects-data.service';

describe('ProjectsDataService', () => {
  let service: ProjectsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectsDataService);
  });

  it('exposes a non-empty projects list', () => {
    expect(service.projects().length).toBeGreaterThan(0);
  });

  it('every project has a title, description, image, link, and tags', () => {
    for (const project of service.projects()) {
      expect(project.title).toBeTruthy();
      expect(project.description).toBeTruthy();
      expect(project.image).toMatch(/^assets\/images\//);
      expect(project.link).toMatch(/^https?:\/\//);
      expect(project.tags.length).toBeGreaterThan(0);
    }
  });

  it('surfaces at least one featured project', () => {
    const featured = service.projects().filter((p) => p.featured);
    expect(featured.length).toBeGreaterThan(0);
  });

  it('Bookstore is a featured Angular project', () => {
    const bookstore = service.projects().find((p) => p.title === 'Bookstore');
    expect(bookstore?.featured).toBe(true);
    expect(bookstore?.tags).toContain('Angular');
  });
});
