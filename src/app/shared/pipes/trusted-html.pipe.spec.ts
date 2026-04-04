import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TrustedHtmlPipe } from './trusted-html.pipe';

describe('TrustedHtmlPipe', () => {
  let pipe: TrustedHtmlPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrustedHtmlPipe],
    });
    pipe = TestBed.inject(TrustedHtmlPipe);
  });

  it('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return a SafeHtml value', () => {
    const result = pipe.transform('<p>Hello</p>');
    expect(result).toBeTruthy();
    expect(typeof result).not.toBe('string');
  });

  it('should handle empty string', () => {
    const result = pipe.transform('');
    expect(result).toBeTruthy();
  });
});
