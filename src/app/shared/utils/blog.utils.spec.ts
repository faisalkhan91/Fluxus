import { describe, it, expect } from 'vitest';
import { formatPostDate, isPostPublished, todayYmd } from './blog.utils';
import type { BlogPost } from '@shared/models/blog-post.model';

function makePost(overrides: Partial<BlogPost>): BlogPost {
  return {
    slug: 'a-post',
    title: 'A Post',
    date: '2025-01-01',
    excerpt: '',
    tags: [],
    ...overrides,
  } as BlogPost;
}

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

describe('todayYmd', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(todayYmd()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isPostPublished', () => {
  const today = '2025-06-02';

  it('returns false for a draft regardless of date', () => {
    expect(isPostPublished(makePost({ draft: true, date: '2020-01-01' }), today)).toBe(false);
  });

  it('returns false for a future-dated (scheduled) post', () => {
    expect(isPostPublished(makePost({ date: '2025-06-03' }), today)).toBe(false);
  });

  it('returns true for a non-draft post dated today or earlier', () => {
    expect(isPostPublished(makePost({ date: '2025-06-02' }), today)).toBe(true);
    expect(isPostPublished(makePost({ date: '2024-12-31' }), today)).toBe(true);
  });

  it('defaults the comparison date to today when omitted', () => {
    expect(isPostPublished(makePost({ date: '2000-01-01' }))).toBe(true);
    expect(isPostPublished(makePost({ date: '2999-01-01' }))).toBe(false);
  });
});
