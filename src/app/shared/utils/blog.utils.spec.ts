import { describe, it, expect } from 'vitest';
import { computeReadingTime, formatPostDate } from './blog.utils';

describe('computeReadingTime', () => {
  it('returns "0 min" for an empty body', () => {
    expect(computeReadingTime('')).toBe('0 min');
  });

  it('floors a very short body at "1 min"', () => {
    expect(computeReadingTime('A single sentence.')).toBe('1 min');
  });

  it('rounds word count divided by ~220 wpm to whole minutes', () => {
    // 1100 words / 220 wpm = 5 minutes exactly.
    const body = Array.from({ length: 1100 }, () => 'word').join(' ');
    expect(computeReadingTime(body)).toBe('5 min');
  });

  it('ignores fenced code blocks so code samples do not inflate the estimate', () => {
    const code = Array.from({ length: 2000 }, () => 'code').join(' ');
    const body = '```js\n' + code + '\n```\n\nOne sentence of prose.';
    expect(computeReadingTime(body)).toBe('1 min');
  });

  it('strips HTML tags before counting', () => {
    const body = '<span>hello</span> <em>world</em>';
    expect(computeReadingTime(body)).toBe('1 min');
  });

  it('strips markdown image syntax before counting', () => {
    const body = '![alt text for an image](/path/to/image.png) ' + 'word '.repeat(20);
    // Only the 20 "word" tokens should count — alt text and URL are stripped.
    expect(computeReadingTime(body)).toBe('1 min');
  });

  it('strips entire markdown link markup (both label and url) from the count', () => {
    // 440 words of prose plus a wall of "[label](url)" links. The link regex
    // drops the whole `[...](...)` block — not just the URL — so the only
    // tokens that survive are the 440 prose words. 440 / 220 wpm → 2 min.
    const prose = 'word '.repeat(440);
    const links = '[label](https://example.com) '.repeat(440);
    expect(computeReadingTime(prose + links)).toBe('2 min');
  });
});

describe('formatPostDate', () => {
  it('formats a valid YYYY-MM-DD string in en-US without timezone drift', () => {
    // Note: January is month index 0 internally; the formatter respects the
    // local calendar day, so this assertion holds regardless of timezone.
    expect(formatPostDate('2025-01-15')).toBe('January 15, 2025');
  });

  it('formats a leap-day string correctly', () => {
    expect(formatPostDate('2024-02-29')).toBe('February 29, 2024');
  });

  it('formats end-of-year dates correctly', () => {
    expect(formatPostDate('2024-12-31')).toBe('December 31, 2024');
  });

  it('returns the original string when parsing fails', () => {
    // Neither the YYYY-MM-DD regex nor `new Date(...)` accepts this garbage;
    // the UI should surface it verbatim so the author can spot the typo.
    expect(formatPostDate('not-a-date')).toBe('not-a-date');
  });

  it('falls back to Date parsing when the input is a non-YYYY-MM-DD ISO', () => {
    // Full ISO timestamps do not match the strict YYYY-MM-DD regex and fall
    // through to `new Date(...)`. The exact formatted day depends on the
    // viewer's timezone, so we only assert that *some* en-US formatted string
    // comes back — not the literal raw input.
    const result = formatPostDate('2025-06-15T12:34:56.000Z');
    expect(result).not.toBe('2025-06-15T12:34:56.000Z');
    expect(result).toMatch(/2025/);
  });
});
