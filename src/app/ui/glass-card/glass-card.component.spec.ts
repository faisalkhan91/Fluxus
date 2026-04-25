import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlassCardComponent } from './glass-card.component';

describe('GlassCardComponent', () => {
  let fixture: ComponentFixture<GlassCardComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GlassCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(GlassCardComponent);
    host = fixture.nativeElement as HTMLElement;
  });

  it('defaults to elevation-1 with neither hover nor glow', () => {
    fixture.detectChanges();
    expect(host.classList.contains('elevation-1')).toBe(true);
    expect(host.classList.contains('hoverable')).toBe(false);
    expect(host.classList.contains('glow')).toBe(false);
  });

  it('applies the elevation-2 class when elevation=2', () => {
    fixture.componentRef.setInput('elevation', 2);
    fixture.detectChanges();
    expect(host.classList.contains('elevation-2')).toBe(true);
    expect(host.classList.contains('elevation-1')).toBe(false);
  });

  it('applies the elevation-3 class when elevation=3', () => {
    fixture.componentRef.setInput('elevation', 3);
    fixture.detectChanges();
    expect(host.classList.contains('elevation-3')).toBe(true);
  });

  it('applies the hoverable class when hover=true', () => {
    fixture.componentRef.setInput('hover', true);
    fixture.detectChanges();
    expect(host.classList.contains('hoverable')).toBe(true);
  });

  it('applies the glow class when glow=true', () => {
    fixture.componentRef.setInput('glow', true);
    fixture.detectChanges();
    expect(host.classList.contains('glow')).toBe(true);
  });
});

@Component({
  selector: 'projection-host',
  imports: [GlassCardComponent],
  template: `<ui-glass-card><p class="child">Projected</p></ui-glass-card>`,
})
class ProjectionHostComponent {}

describe('GlassCardComponent — content projection', () => {
  it('projects ng-content children', async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectionHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectionHostComponent);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('ui-glass-card');
    expect(card?.querySelector('.child')?.textContent).toBe('Projected');
  });
});
