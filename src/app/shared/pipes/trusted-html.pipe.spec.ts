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

  it('returns a SafeHtml when the source is "local-markdown"', () => {
    const result = pipe.transform('<p>Hello</p>', 'local-markdown');
    expect(result).toBeTruthy();
    expect(typeof result).not.toBe('string');
  });

  it('handles empty strings as "local-markdown"', () => {
    const result = pipe.transform('', 'local-markdown');
    expect(result).toBeTruthy();
  });

  it('throws for unknown sources to prevent silent reuse', () => {
    expect(() =>
      // Cast through `unknown` to exercise the runtime guard the way an
      // accidental misuse would land — TypeScript would flag this in
      // production code, but the runtime check is the actual gate.
      pipe.transform('<p>x</p>', 'remote' as unknown as 'local-markdown'),
    ).toThrow(/Refusing to bypass sanitisation/);
  });
});
