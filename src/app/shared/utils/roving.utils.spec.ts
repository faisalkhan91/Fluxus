import { describe, it, expect } from 'vitest';
import { rovingNext } from './roving.utils';

describe('rovingNext', () => {
  it('moves forward within range', () => {
    expect(rovingNext(0, 1, 3)).toBe(1);
  });

  it('wraps forward past the end', () => {
    expect(rovingNext(2, 1, 3)).toBe(0);
  });

  it('wraps backward past the start', () => {
    expect(rovingNext(0, -1, 3)).toBe(2);
  });

  it('moves backward within range', () => {
    expect(rovingNext(2, -1, 3)).toBe(1);
  });
});
