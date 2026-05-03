import { describe, it, expect } from 'vitest';
import {
  compactNumber,
  languagesBarLabel,
  languagesPercent,
  relativeTime,
} from './github-format.utils';

describe('github-format utils', () => {
  describe('relativeTime', () => {
    const NOW = Date.parse('2026-05-03T12:00:00Z');

    it('returns "today" when the timestamp is less than a day old', () => {
      const iso = new Date(NOW - 2 * 3_600_000).toISOString();
      expect(relativeTime(iso, NOW)).toBe('today');
    });

    it('returns "Nd ago" for under-month distances', () => {
      const iso = new Date(NOW - 5 * 86_400_000).toISOString();
      expect(relativeTime(iso, NOW)).toBe('5d ago');
    });

    it('returns "Nmo ago" for under-year distances', () => {
      const iso = new Date(NOW - 120 * 86_400_000).toISOString();
      expect(relativeTime(iso, NOW)).toBe('4mo ago');
    });

    it('returns the four-digit year for anything older', () => {
      expect(relativeTime('2020-06-15T00:00:00Z', NOW)).toBe('2020');
    });

    it('clamps negative diffs (clock skew) to "today"', () => {
      const iso = new Date(NOW + 5 * 86_400_000).toISOString();
      expect(relativeTime(iso, NOW)).toBe('today');
    });

    it('returns empty string for null / undefined / unparseable input', () => {
      expect(relativeTime(null)).toBe('');
      expect(relativeTime(undefined)).toBe('');
      expect(relativeTime('not-a-date')).toBe('');
    });
  });

  describe('compactNumber', () => {
    it('renders values under 1000 verbatim', () => {
      expect(compactNumber(0)).toBe('0');
      expect(compactNumber(42)).toBe('42');
      expect(compactNumber(999)).toBe('999');
    });

    it('renders 1000–9999 as "X.Yk" with one decimal', () => {
      expect(compactNumber(1200)).toBe('1.2k');
      expect(compactNumber(9999)).toBe('10.0k');
    });

    it('renders values ≥10000 as rounded "Xk"', () => {
      expect(compactNumber(12_345)).toBe('12k');
      expect(compactNumber(1_000_000)).toBe('1000k');
    });

    it('returns empty string for null / undefined', () => {
      expect(compactNumber(null)).toBe('');
      expect(compactNumber(undefined)).toBe('');
    });
  });

  describe('languagesPercent', () => {
    const segments = [
      { name: 'TypeScript', bytes: 8000 },
      { name: 'HTML', bytes: 2000 },
    ];

    it('formats the target language as a percent of the total bytes', () => {
      expect(languagesPercent(segments, 'TypeScript')).toBe('80.0%');
      expect(languagesPercent(segments, 'HTML')).toBe('20.0%');
    });

    it('returns 0.0% for an unknown language rather than throwing', () => {
      expect(languagesPercent(segments, 'Klingon')).toBe('0.0%');
    });

    it('returns empty string when the segment list is empty or all-zero', () => {
      expect(languagesPercent([], 'TypeScript')).toBe('');
      expect(languagesPercent(undefined, 'TypeScript')).toBe('');
      expect(languagesPercent([{ name: 'TypeScript', bytes: 0 }], 'TypeScript')).toBe('');
    });
  });

  describe('languagesBarLabel', () => {
    it('joins segments as "Name P.P%, Name P.P%"', () => {
      expect(
        languagesBarLabel([
          { name: 'TypeScript', bytes: 8000 },
          { name: 'HTML', bytes: 2000 },
        ]),
      ).toBe('TypeScript 80.0%, HTML 20.0%');
    });

    it('returns empty string when there are no segments', () => {
      expect(languagesBarLabel([])).toBe('');
      expect(languagesBarLabel(undefined)).toBe('');
    });
  });
});
