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

  it('Storm Events Analysis is a featured Python/Data Science project', () => {
    // Sentinel assertion: a hand-curated entry with the expected
    // shape (featured flag flows through, tags present) survived
    // the fetch → merge → emit pipeline. The specific row is a
    // curation choice in `projects.overrides.json`; update the
    // expectations when the featured set rotates.
    const storm = service.projects().find((p) => p.title === 'Storm Events Analysis');
    expect(storm?.featured).toBe(true);
    expect(storm?.tags).toContain('Python');
  });

  it('every project carries a URL-safe slug derived by the fetch script', () => {
    // The generated file is emitted by scripts/fetch-projects-github.mjs,
    // which slugifies titles. We assert the contract here because every
    // downstream consumer (palette fragments, /projects/:slug route,
    // sitemap) keys off this field.
    for (const project of service.projects()) {
      expect(project.slug).toBeTruthy();
      expect(project.slug).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
  });

  it('exposes optional github meta fields homepage, languagesBytes, latestRelease', () => {
    // Shape check only — test fixtures can have any values including
    // null. This asserts the fields survive the generated-file →
    // service → consumer pipeline without being stripped by TS
    // widening or JSON round-trip.
    for (const project of service.projects()) {
      if (!project.github) continue;
      expect('homepage' in project.github).toBe(true);
      expect(Array.isArray(project.github.languagesBytes)).toBe(true);
      expect('latestRelease' in project.github).toBe(true);
    }
  });
});
