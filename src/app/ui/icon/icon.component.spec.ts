import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IconComponent],
    });
  });

  it('renders an accessibility-friendly <svg> shell with sizing attributes', () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'home');
    fixture.componentRef.setInput('size', 24);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
  });

  it('injects path content for known icon names on the browser via effect', async () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'home');
    fixture.detectChanges();
    await fixture.whenStable();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.innerHTML).toContain('<path');
  });

  it('keeps the svg empty for unknown icon names', async () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'does-not-exist');
    fixture.detectChanges();
    await fixture.whenStable();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.innerHTML.trim()).toBe('');
  });
});
