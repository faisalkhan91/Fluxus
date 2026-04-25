import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProfileDataService } from './profile-data.service';

describe('ProfileDataService', () => {
  let service: ProfileDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileDataService);
  });

  it('personalInfo contains required identity fields', () => {
    const info = service.personalInfo();
    expect(info.name).toBeTruthy();
    expect(info.title).toBeTruthy();
    expect(info.email).toMatch(/@/);
    expect(info.avatar).toMatch(/^assets\//);
  });

  it('personalInfo.bio is a non-empty array of non-empty paragraphs', () => {
    const bio = service.personalInfo().bio;
    expect(bio.length).toBeGreaterThan(0);
    for (const paragraph of bio) {
      expect(paragraph).toBeTruthy();
    }
  });

  it('bio interpolates the computed years of experience', () => {
    const firstParagraph = service.personalInfo().bio[0];
    // The first paragraph reads "... with <N>+ years of experience ...".
    expect(firstParagraph).toMatch(/\d+\+\s+years of experience/);
  });

  it('education carries year + degree + institution for each entry', () => {
    const education = service.education();
    expect(education.length).toBeGreaterThan(0);
    for (const entry of education) {
      expect(entry.year).toMatch(/^\d{4}$/);
      expect(entry.degree).toBeTruthy();
      expect(entry.institution).toBeTruthy();
    }
  });

  it('socialLinks expose GitHub, LinkedIn, and Credly', () => {
    const platforms = service.socialLinks().map((l) => l.platform);
    expect(platforms).toEqual(expect.arrayContaining(['GitHub', 'LinkedIn', 'Credly']));
  });

  it('every socialLink has a usable url and an icon', () => {
    for (const link of service.socialLinks()) {
      expect(link.url).toMatch(/^https?:\/\//);
      expect(link.icon).toBeTruthy();
      expect(link.label).toBeTruthy();
    }
  });
});
