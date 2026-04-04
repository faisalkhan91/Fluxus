import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ContactComponent } from './contact.component';
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
    bio: ['Bio.'],
  }),
  socialLinks: signal([]),
};

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let component: ContactComponent;
  let el: HTMLElement;
  let windowOpenSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    await TestBed.configureTestingModule({
      imports: [ContactComponent, ReactiveFormsModule],
      providers: [{ provide: ProfileDataService, useValue: mockProfile }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  function fillForm(values: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): void {
    const inputs = el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('.form-input');
    const nameInput = inputs[0];
    const emailInput = inputs[1];
    const subjectInput = inputs[2];
    const messageInput = inputs[3];

    nameInput.value = values.name;
    nameInput.dispatchEvent(new Event('input'));
    emailInput.value = values.email;
    emailInput.dispatchEvent(new Event('input'));
    subjectInput.value = values.subject;
    subjectInput.dispatchEvent(new Event('input'));
    messageInput.value = values.message;
    messageInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function touchField(id: string): void {
    const input = el.querySelector(`#${id}`) as HTMLElement;
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render the form initially', () => {
    expect(el.querySelector('form')).toBeTruthy();
    expect(el.querySelector('.success-state')).toBeNull();
  });

  it('should not call window.open on submit with empty form', () => {
    component.onSubmit();
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('should call window.open with mailto on valid submit', () => {
    fillForm({ name: 'John', email: 'john@test.com', subject: 'Hello', message: 'Test message' });
    component.onSubmit();
    expect(windowOpenSpy).toHaveBeenCalledOnce();
    const url = windowOpenSpy.mock.calls[0][0] as string;
    expect(url).toContain('mailto:test@example.com');
    expect(url).toContain('subject=Hello');
    expect(url).toContain('John');
  });

  it('should show success state after valid submit', () => {
    fillForm({ name: 'John', email: 'john@test.com', subject: '', message: 'Test' });
    component.onSubmit();
    fixture.detectChanges();
    expect(el.querySelector('.success-state')).toBeTruthy();
    expect(el.querySelector('form')).toBeNull();
  });

  it('should show name required error when touched and empty', () => {
    touchField('name');
    const error = el.querySelector('#name-error');
    expect(error?.textContent?.trim()).toBe('Name is required');
  });

  it('should show email required error when touched and empty', () => {
    touchField('email');
    const error = el.querySelector('#email-error');
    expect(error?.textContent?.trim()).toContain('Email is required');
  });

  it('should show email format error for invalid email', () => {
    const emailInput = el.querySelector('#email') as HTMLInputElement;
    emailInput.value = 'notanemail';
    emailInput.dispatchEvent(new Event('input'));
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const error = el.querySelector('#email-error');
    expect(error?.textContent?.trim()).toContain('valid email');
  });

  it('should show message required error when touched and empty', () => {
    touchField('message');
    const error = el.querySelector('#message-error');
    expect(error?.textContent?.trim()).toBe('Message is required');
  });

  it('should render contact info sidebar', () => {
    const mailto = el.querySelector('.contact-info a[href^="mailto:"]') as HTMLAnchorElement;
    expect(mailto?.href).toContain('test@example.com');
  });
});
