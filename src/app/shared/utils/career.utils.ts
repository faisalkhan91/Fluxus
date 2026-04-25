const CAREER_START = new Date(2013, 4); // May 2013

/**
 * Years of professional experience since {@link CAREER_START}. Accepts an
 * optional `now` so callers (and tests) can drive the calculation against a
 * fixed reference date without reaching for `vi.useFakeTimers`.
 */
export function yearsOfExperience(now: Date = new Date()): number {
  let years = now.getFullYear() - CAREER_START.getFullYear();
  if (now.getMonth() < CAREER_START.getMonth()) years--;
  return years;
}
