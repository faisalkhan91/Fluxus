import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CertificationsDataService } from './certifications-data.service';

describe('CertificationsDataService', () => {
  let service: CertificationsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CertificationsDataService);
  });

  it('every certification has a name and image path', () => {
    const certs = service.certifications();
    expect(certs.length).toBeGreaterThan(0);
    for (const cert of certs) {
      expect(cert.name).toBeTruthy();
      expect(cert.image).toMatch(/^assets\//);
    }
  });

  it('course providers carry non-empty course lists', () => {
    const providers = service.courseProviders();
    expect(providers.length).toBeGreaterThan(0);
    for (const provider of providers) {
      expect(provider.name).toBeTruthy();
      expect(provider.courses.length).toBeGreaterThan(0);
    }
  });

  it('awards are non-empty descriptions', () => {
    const awards = service.awards();
    expect(awards.length).toBeGreaterThan(0);
    for (const award of awards) {
      expect(award.description).toBeTruthy();
    }
  });

  it('surfaces the Azure AI Engineer Associate certification', () => {
    const cert = service
      .certifications()
      .find((c) => c.name.includes('Azure AI Engineer Associate'));
    expect(cert?.issuer).toBe('Microsoft');
  });
});
