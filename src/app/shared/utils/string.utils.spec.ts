import { describe, it, expect } from 'vitest';
import { slugify } from './string.utils';

describe('slugify', () => {
  it('should lowercase and replace spaces with hyphens', () => {
    expect(slugify('Programming Languages')).toBe('programming-languages');
  });

  it('should handle multiple spaces', () => {
    expect(slugify('Storm   Events   Analysis')).toBe('storm-events-analysis');
  });

  it('should strip special characters', () => {
    expect(slugify('C++ & C#')).toBe('c-c');
  });

  it('should trim whitespace', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('should replace underscores with hyphens', () => {
    expect(slugify('hello_world')).toBe('hello-world');
  });

  it('should collapse consecutive hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('should handle already-slugified input', () => {
    expect(slugify('already-slugified')).toBe('already-slugified');
  });

  it('should return empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });
});
