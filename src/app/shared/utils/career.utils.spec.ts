import { describe, it, expect } from 'vitest';
import { yearsOfExperience } from './career.utils';

describe('yearsOfExperience', () => {
  it('returns 0 on the career-start month (May 2013)', () => {
    expect(yearsOfExperience(new Date(2013, 4, 15))).toBe(0);
  });

  it('returns a whole number of years after the anniversary passes', () => {
    // May 2023 is the 10-year anniversary — same month, so the full decade counts.
    expect(yearsOfExperience(new Date(2023, 4, 1))).toBe(10);
  });

  it('rolls back by one year when the current month precedes the start month', () => {
    // April 2023 is one month before the May anniversary, so the last year
    // isn't yet earned.
    expect(yearsOfExperience(new Date(2023, 3, 30))).toBe(9);
  });

  it('computes multi-decade spans correctly', () => {
    expect(yearsOfExperience(new Date(2030, 11, 1))).toBe(17);
  });

  it('smoke-tests the live clock path (defaults to new Date())', () => {
    // Sanity check that the default-parameter branch works against the wall
    // clock. The concrete value is intentionally loose — the math above is
    // what proves correctness.
    expect(yearsOfExperience()).toBeGreaterThanOrEqual(10);
  });
});
