import { describe, it, expect } from 'vitest';
import { yearsOfExperience } from './career.utils';

describe('yearsOfExperience', () => {
  it('should return a positive number', () => {
    expect(yearsOfExperience()).toBeGreaterThan(0);
  });

  it('should return at least 10 years (career started May 2013)', () => {
    expect(yearsOfExperience()).toBeGreaterThanOrEqual(10);
  });

  it('should return a whole number', () => {
    expect(Number.isInteger(yearsOfExperience())).toBe(true);
  });
});
