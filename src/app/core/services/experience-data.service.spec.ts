import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ExperienceDataService } from './experience-data.service';

describe('ExperienceDataService', () => {
  let service: ExperienceDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExperienceDataService);
  });

  it('exposes a non-empty timeline', () => {
    const items = service.items();
    expect(items.length).toBeGreaterThan(0);
  });

  it('every entry is either a period marker or a job row', () => {
    for (const item of service.items()) {
      expect(['period', 'job']).toContain(item.type);
    }
  });

  it('period markers carry a company title', () => {
    const periods = service.items().filter((i) => i.type === 'period');
    expect(periods.length).toBeGreaterThan(0);
    for (const period of periods) {
      expect(period.title).toBeTruthy();
    }
  });

  it('job rows include role, duration, and at least one achievement', () => {
    const jobs = service.items().filter((i) => i.type === 'job');
    expect(jobs.length).toBeGreaterThan(0);
    for (const job of jobs) {
      expect(job.role).toBeTruthy();
      expect(job.duration).toBeTruthy();
      expect(job.achievements?.length).toBeGreaterThan(0);
    }
  });

  it('leads with SoFi as the most recent period', () => {
    expect(service.items()[0]).toEqual({ type: 'period', title: 'SoFi' });
  });
});
