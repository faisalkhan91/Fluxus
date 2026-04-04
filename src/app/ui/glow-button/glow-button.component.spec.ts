import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlowButtonComponent } from './glow-button.component';

describe('GlowButtonComponent', () => {
  let fixture: ComponentFixture<GlowButtonComponent>;
  let component: GlowButtonComponent;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlowButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GlowButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should default to primary variant', () => {
    expect(button.className).toContain('btn--primary');
  });

  it('should apply secondary variant class', () => {
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();
    expect(button.className).toContain('btn--secondary');
  });

  it('should apply ghost variant class', () => {
    fixture.componentRef.setInput('variant', 'ghost');
    fixture.detectChanges();
    expect(button.className).toContain('btn--ghost');
  });

  it('should default to button type', () => {
    expect(button.type).toBe('button');
  });

  it('should set submit type', () => {
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();
    expect(button.type).toBe('submit');
  });

  it('should not be disabled by default', () => {
    expect(button.disabled).toBe(false);
  });

  it('should set disabled attribute', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
  });

  it('should emit clicked on click', () => {
    let emitted: MouseEvent | undefined;
    component.clicked.subscribe((e: MouseEvent) => (emitted = e));
    button.click();
    expect(emitted).toBeInstanceOf(MouseEvent);
  });
});
