// Canonical career start. Mirrored (by necessity — a `.mjs` build script
// can't import this `.ts`) in scripts/generate-resume.mjs; keep both the
// start month and the calendar-diff math below in sync so the generated
// resume never disagrees with the site by a year at a month boundary.
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
