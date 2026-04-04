import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionHeaderComponent } from './section-header.component';

describe('SectionHeaderComponent', () => {
  let fixture: ComponentFixture<SectionHeaderComponent>;
  let component: SectionHeaderComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title in an h2', () => {
    const h2 = el.querySelector('h2');
    expect(h2?.textContent?.trim()).toBe('Test Title');
  });

  it('should set headingId on the h2', () => {
    fixture.componentRef.setInput('headingId', 'my-heading');
    fixture.detectChanges();
    const h2 = el.querySelector('h2');
    expect(h2?.id).toBe('my-heading');
  });

  it('should not render subtitle when not provided', () => {
    expect(el.querySelector('.subtitle')).toBeNull();
  });

  it('should render subtitle when provided', () => {
    fixture.componentRef.setInput('subtitle', 'A subtitle');
    fixture.detectChanges();
    const sub = el.querySelector('.subtitle');
    expect(sub?.textContent?.trim()).toBe('A subtitle');
  });

  it('should not render decoration when not provided', () => {
    expect(el.querySelector('.decoration')).toBeNull();
  });

  it('should render decoration when provided', () => {
    fixture.componentRef.setInput('decoration', '// test.ts');
    fixture.detectChanges();
    const deco = el.querySelector('.decoration');
    expect(deco?.textContent?.trim()).toBe('// test.ts');
  });
});
