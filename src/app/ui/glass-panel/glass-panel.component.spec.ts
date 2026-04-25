import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlassPanelComponent } from './glass-panel.component';

describe('GlassPanelComponent', () => {
  let fixture: ComponentFixture<GlassPanelComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GlassPanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(GlassPanelComponent);
    host = fixture.nativeElement as HTMLElement;
  });

  it('defaults to neither scrollable nor flush', () => {
    fixture.detectChanges();
    expect(host.classList.contains('scrollable')).toBe(false);
    expect(host.classList.contains('flush')).toBe(false);
  });

  it('applies the scrollable class when scrollable=true', () => {
    fixture.componentRef.setInput('scrollable', true);
    fixture.detectChanges();
    expect(host.classList.contains('scrollable')).toBe(true);
  });

  it('applies the flush class when flush=true', () => {
    fixture.componentRef.setInput('flush', true);
    fixture.detectChanges();
    expect(host.classList.contains('flush')).toBe(true);
  });

  it('applies both classes when both flags are set', () => {
    fixture.componentRef.setInput('scrollable', true);
    fixture.componentRef.setInput('flush', true);
    fixture.detectChanges();
    expect(host.classList.contains('scrollable')).toBe(true);
    expect(host.classList.contains('flush')).toBe(true);
  });
});

@Component({
  selector: 'projection-host',
  imports: [GlassPanelComponent],
  template: `<ui-glass-panel><p class="child">Projected</p></ui-glass-panel>`,
})
class ProjectionHostComponent {}

describe('GlassPanelComponent — content projection', () => {
  it('projects ng-content children', async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectionHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectionHostComponent);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('ui-glass-panel');
    expect(panel?.querySelector('.child')?.textContent).toBe('Projected');
  });
});
