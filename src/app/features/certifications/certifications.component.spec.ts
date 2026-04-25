import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { CertificationsComponent } from './certifications.component';
import { CertificationsDataService } from '@core/services/certifications-data.service';

const mockData = {
  certifications: signal([
    { name: 'Cert One', image: 'cert-one.webp', issuer: 'Acme' },
    { name: 'Cert Two', image: 'cert-two.png', issuer: 'Globex' },
  ]),
  courseProviders: signal([
    { name: 'Pluralsight', courses: ['Course A', 'Course B'] },
    { name: 'Coursera', courses: ['Course C'] },
  ]),
  awards: signal([{ description: 'Top performer' }, { description: 'Innovation award' }]),
};

describe('CertificationsComponent', () => {
  let fixture: ComponentFixture<CertificationsComponent>;
  let component: CertificationsComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificationsComponent],
      providers: [{ provide: CertificationsDataService, useValue: mockData }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('renders an h1 page header titled "Certifications"', () => {
    const h1 = el.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Certifications');
  });

  it('renders one card per certification', () => {
    const cards = el.querySelectorAll('.cert-card');
    expect(cards.length).toBe(2);
  });

  it('renders the issuer when present', () => {
    const issuers = Array.from(el.querySelectorAll('.cert-issuer')).map((n) =>
      n.textContent?.trim(),
    );
    expect(issuers).toContain('Acme');
    expect(issuers).toContain('Globex');
  });

  it('renders an accordion header per course provider', () => {
    const headers = el.querySelectorAll('.accordion-header');
    expect(headers.length).toBe(2);
  });

  it('toggleProvider expands and collapses providers', () => {
    expect(component['expandedProvider']()).toBeNull();
    component.toggleProvider('Pluralsight');
    expect(component['expandedProvider']()).toBe('Pluralsight');
    component.toggleProvider('Pluralsight');
    expect(component['expandedProvider']()).toBeNull();
  });

  it('switches expansion target when a different provider is clicked', () => {
    component.toggleProvider('Pluralsight');
    component.toggleProvider('Coursera');
    expect(component['expandedProvider']()).toBe('Coursera');
  });

  it('renders course list only for the expanded provider', () => {
    component.toggleProvider('Pluralsight');
    fixture.detectChanges();
    const courseLists = el.querySelectorAll('.course-items');
    expect(courseLists.length).toBe(1);
    expect(courseLists[0].textContent).toContain('Course A');
    expect(courseLists[0].textContent).toContain('Course B');
  });

  it('reflects expansion state via aria-expanded', () => {
    component.toggleProvider('Pluralsight');
    fixture.detectChanges();
    const headers = el.querySelectorAll('.accordion-header');
    expect(headers[0].getAttribute('aria-expanded')).toBe('true');
    expect(headers[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('renders awards', () => {
    const awards = el.querySelectorAll('.award-item');
    expect(awards.length).toBe(2);
  });
});
