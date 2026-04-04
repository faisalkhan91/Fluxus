import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { signal } from '@angular/core';
import { AboutComponent } from './about.component';
import { ProfileDataService } from '../../core/services/profile-data.service';

const mockProfile = {
  personalInfo: signal({
    name: 'Test User',
    title: 'Engineer',
    email: 'test@example.com',
    phone: '555-1234',
    website: 'https://example.com',
    location: 'Seattle, WA',
    linkedIn: 'https://linkedin.com/in/test',
    github: 'https://github.com/test',
    avatar: 'assets/images/test.jpg',
    bio: ['Paragraph one.', 'Paragraph two.'],
  }),
  education: signal([
    { year: '2020', degree: 'MS Computer Science', institution: 'MIT' },
    { year: '2016', degree: 'BS Engineering', institution: 'Stanford' },
  ]),
  socialLinks: signal([
    { platform: 'GitHub', url: 'https://github.com/test', icon: 'github', label: 'GitHub' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/in/test', icon: 'linkedin', label: 'LinkedIn' },
    { platform: 'Credly', url: 'https://credly.com/test', icon: 'shield', label: 'Credly Certs' },
  ]),
};

describe('AboutComponent', () => {
  let fixture: ComponentFixture<AboutComponent>;
  let component: AboutComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [{ provide: ProfileDataService, useValue: mockProfile }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render bio paragraphs', () => {
    const paragraphs = el.querySelectorAll('.bio-text p');
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].textContent).toContain('Paragraph one');
    expect(paragraphs[1].textContent).toContain('Paragraph two');
  });

  it('should render the avatar name', () => {
    const name = el.querySelector('.avatar-name');
    expect(name?.textContent?.trim()).toBe('Test User');
  });

  it('should render education entries', () => {
    const items = el.querySelectorAll('.edu-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('MS Computer Science');
    expect(items[1].textContent).toContain('BS Engineering');
  });

  it('should render mailto link with correct email', () => {
    const mailto = el.querySelector('a[href^="mailto:"]') as HTMLAnchorElement;
    expect(mailto?.href).toContain('test@example.com');
  });

  it('should filter out GitHub and LinkedIn from the social links loop', () => {
    const contactItems = el.querySelectorAll('.about-contact .contact-item');
    const platformLabels = Array.from(contactItems).map(
      (item) => item.querySelector('.contact-label')?.textContent?.trim(),
    );
    expect(platformLabels).toContain('Credly');
    expect(platformLabels.filter((l) => l === 'GitHub').length).toBe(0);
    // One LinkedIn exists from the hardcoded contact card, not the social loop
    expect(platformLabels.filter((l) => l === 'LinkedIn').length).toBe(1);
  });
});
