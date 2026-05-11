import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SkillBadgeComponent } from './skill-badge.component';

describe('SkillBadgeComponent', () => {
  let fixture: ComponentFixture<SkillBadgeComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillBadgeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SkillBadgeComponent);
    el = fixture.nativeElement;
  });

  it('renders the skill name', () => {
    fixture.componentRef.setInput('name', 'TypeScript');
    fixture.detectChanges();
    expect(el.querySelector('.badge-name')?.textContent?.trim()).toBe('TypeScript');
  });

  it('omits the icon img when iconSrc is undefined', () => {
    fixture.componentRef.setInput('name', 'Go');
    fixture.detectChanges();
    expect(el.querySelector('.badge-icon')).toBeNull();
  });

  it('renders the icon img with ngSrc + alt when iconSrc is provided', () => {
    fixture.componentRef.setInput('name', 'Angular');
    fixture.componentRef.setInput('iconSrc', '/assets/icons/angular.svg');
    fixture.detectChanges();

    const img = el.querySelector('img.badge-icon') as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img?.alt).toBe('Angular');
    expect(img?.getAttribute('src') ?? img?.src ?? '').toContain('angular.svg');
  });

  it('never renders visible count pills (grid stays uniform)', () => {
    fixture.componentRef.setInput('name', 'Rust');
    fixture.componentRef.setInput('href', '/projects/tag/rust');
    fixture.componentRef.setInput('projectsCount', 3);
    fixture.detectChanges();
    // The visible `1p` / `2b` pills were removed in iteration 4 —
    // counts live on the feature strip and list view instead.
    expect(el.querySelector('.badge-captions')).toBeNull();
    expect(el.querySelector('.badge-caption-link')).toBeNull();
  });

  describe('dim cue', () => {
    it('applies the dimmed class when dimmed is true', () => {
      fixture.componentRef.setInput('name', 'Obscure');
      fixture.componentRef.setInput('dimmed', true);
      fixture.detectChanges();
      expect(el.querySelector('.dimmed')).not.toBeNull();
    });

    it('does not apply the dimmed class by default', () => {
      fixture.componentRef.setInput('name', 'Default');
      fixture.detectChanges();
      expect(el.querySelector('.dimmed')).toBeNull();
    });
  });

  describe('tagline', () => {
    it('surfaces the tagline via the native title attribute', () => {
      fixture.componentRef.setInput('name', 'Python');
      fixture.componentRef.setInput('tagline', 'Primary backend language.');
      fixture.detectChanges();
      const inner = el.querySelector('.badge-inner') as HTMLElement;
      expect(inner.getAttribute('title')).toBe('Primary backend language.');
    });

    it('omits the title attribute when no tagline is supplied', () => {
      fixture.componentRef.setInput('name', 'Quiet');
      fixture.detectChanges();
      const inner = el.querySelector('.badge-inner') as HTMLElement;
      expect(inner.getAttribute('title')).toBeNull();
    });
  });

  describe('card link', () => {
    it('renders no anchor when href is omitted', () => {
      fixture.componentRef.setInput('name', 'Static');
      fixture.detectChanges();
      expect(el.querySelector('.badge-inner-link')).toBeNull();
      expect(el.querySelector('a.badge-card-link')).toBeNull();
    });

    it('renders a stretched empty anchor when href is set', () => {
      fixture.componentRef.setInput('name', 'Rust');
      fixture.componentRef.setInput('href', '/projects/tag/rust');
      fixture.componentRef.setInput('projectsCount', 3);
      fixture.detectChanges();

      const inner = el.querySelector('.badge-inner-link');
      expect(inner).not.toBeNull();
      const link = el.querySelector('a.badge-card-link') as HTMLAnchorElement | null;
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('/projects/tag/rust');
      // Anchor is visually empty; the aria-label carries the semantics.
      expect(link?.textContent?.trim()).toBe('');
    });

    it('exposes the count via aria-label', () => {
      fixture.componentRef.setInput('name', 'Rust');
      fixture.componentRef.setInput('href', '/projects/tag/rust');
      fixture.componentRef.setInput('projectsCount', 3);
      fixture.detectChanges();
      const link = el.querySelector('a.badge-card-link') as HTMLAnchorElement;
      expect(link.getAttribute('aria-label')).toBe('Rust — view 3 projects');
    });

    it('singular form when projectsCount === 1', () => {
      fixture.componentRef.setInput('name', 'Solo');
      fixture.componentRef.setInput('href', '/projects/tag/solo');
      fixture.componentRef.setInput('projectsCount', 1);
      fixture.detectChanges();
      expect(el.querySelector('a.badge-card-link')?.getAttribute('aria-label')).toBe(
        'Solo — view 1 project',
      );
    });

    it('falls back to the skill name when projectsCount is 0', () => {
      fixture.componentRef.setInput('name', 'Empty');
      fixture.componentRef.setInput('href', '/projects/tag/empty');
      fixture.componentRef.setInput('projectsCount', 0);
      fixture.detectChanges();
      expect(el.querySelector('a.badge-card-link')?.getAttribute('aria-label')).toBe('Empty');
    });
  });
});
