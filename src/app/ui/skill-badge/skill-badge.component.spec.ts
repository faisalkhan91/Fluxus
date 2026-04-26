import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkillBadgeComponent } from './skill-badge.component';

describe('SkillBadgeComponent', () => {
  let fixture: ComponentFixture<SkillBadgeComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillBadgeComponent],
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
    // NgOptimizedImage rewrites the src attribute at runtime — just confirm
    // the filename segment made it through rather than checking the literal.
    expect(img?.getAttribute('src') ?? img?.src ?? '').toContain('angular.svg');
  });

  it('omits the progress bar when level is undefined or 0', () => {
    fixture.componentRef.setInput('name', 'Rust');
    fixture.detectChanges();
    expect(el.querySelector('.badge-bar')).toBeNull();

    fixture.componentRef.setInput('level', 0);
    fixture.detectChanges();
    expect(el.querySelector('.badge-bar')).toBeNull();
  });

  it('renders a progressbar with ARIA attributes when level > 0', () => {
    fixture.componentRef.setInput('name', 'Python');
    fixture.componentRef.setInput('level', 75);
    fixture.detectChanges();

    const bar = el.querySelector('.badge-bar');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('role')).toBe('progressbar');
    expect(bar?.getAttribute('aria-valuenow')).toBe('75');
    expect(bar?.getAttribute('aria-valuemin')).toBe('0');
    expect(bar?.getAttribute('aria-valuemax')).toBe('100');
  });

  it('sets --badge-fill-scale to match the level percentage', () => {
    fixture.componentRef.setInput('name', 'Docker');
    fixture.componentRef.setInput('level', 100);
    fixture.detectChanges();

    const fill = el.querySelector('.badge-fill') as HTMLElement | null;
    expect(fill).not.toBeNull();
    /*
      The fill rail is always 100% wide; its visible length is driven by
      `transform: scaleX(var(--badge-fill-scale))`. Assert the custom
      property the component sets, which is what the CSS reads.
    */
    expect(fill?.style.getPropertyValue('--badge-fill-scale')).toBe('1');
  });

  it('scales --badge-fill-scale proportionally below 100%', () => {
    fixture.componentRef.setInput('name', 'Docker');
    fixture.componentRef.setInput('level', 75);
    fixture.detectChanges();

    const fill = el.querySelector('.badge-fill') as HTMLElement | null;
    expect(fill?.style.getPropertyValue('--badge-fill-scale')).toBe('0.75');
  });
});
