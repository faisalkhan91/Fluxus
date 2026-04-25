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

  it('renders the icon shapes inline (no innerHTML mutation, SSR-friendly)', () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'home');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    // `home` is composed of a <path> + a <polyline>.
    expect(svg.querySelectorAll('path').length).toBe(1);
    expect(svg.querySelectorAll('polyline').length).toBe(1);
  });

  it('renders nothing inside the svg for unknown icon names', () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'does-not-exist');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.children.length).toBe(0);
  });

  it('switches shapes when the name input changes', () => {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', 'home');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('polyline').length).toBe(1);

    fixture.componentRef.setInput('name', 'menu');
    fixture.detectChanges();
    // `menu` is three <line> elements, no polylines.
    expect(fixture.nativeElement.querySelectorAll('line').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('polyline').length).toBe(0);
  });
});
