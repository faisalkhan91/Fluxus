import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BottomSheetComponent } from './bottom-sheet.component';

describe('BottomSheetComponent', () => {
  let fixture: ComponentFixture<BottomSheetComponent>;
  let component: BottomSheetComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomSheetComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render nothing when open is false', () => {
    expect(el.querySelector('.backdrop')).toBeNull();
    expect(el.querySelector('.sheet')).toBeNull();
  });

  it('should render backdrop and sheet when open is true', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(el.querySelector('.backdrop')).toBeTruthy();
    expect(el.querySelector('.sheet')).toBeTruthy();
  });

  it('should emit closed on backdrop click', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    const backdrop = el.querySelector('.backdrop') as HTMLElement;
    backdrop.click();
    expect(emitted).toBe(true);
  });

  it('should emit closed on Escape key', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    component.onEscapeKey();
    expect(emitted).toBe(true);
  });

  it('should not emit closed on Escape when not open', () => {
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    component.onEscapeKey();
    expect(emitted).toBe(false);
  });

  it('should show close button when title is set', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Test Sheet');
    fixture.detectChanges();
    const closeBtn = el.querySelector('.close-btn');
    expect(closeBtn).toBeTruthy();
  });

  it('should emit closed when close button is clicked', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Test Sheet');
    fixture.detectChanges();
    let emitted = false;
    component.closed.subscribe(() => (emitted = true));
    const closeBtn = el.querySelector('.close-btn') as HTMLButtonElement;
    closeBtn.click();
    expect(emitted).toBe(true);
  });

  it('should not show close button when no title', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(el.querySelector('.close-btn')).toBeNull();
  });

  it('should render sheet title text', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'My Sheet');
    fixture.detectChanges();
    const title = el.querySelector('.sheet-title');
    expect(title?.textContent?.trim()).toBe('My Sheet');
  });

  it('should set aria-label on sheet from title', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Dialog Title');
    fixture.detectChanges();
    const sheet = el.querySelector('.sheet');
    expect(sheet?.getAttribute('aria-label')).toBe('Dialog Title');
  });

  it('should have role dialog on sheet', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const sheet = el.querySelector('.sheet');
    expect(sheet?.getAttribute('role')).toBe('dialog');
    expect(sheet?.getAttribute('aria-modal')).toBe('true');
  });

  it('should have no vertical transform offset initially', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const sheet = el.querySelector('.sheet') as HTMLElement;
    expect(sheet.style.transform).toBe('translateY(0px)');
  });
});
