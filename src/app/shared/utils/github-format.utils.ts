/**
 * View-layer formatters for the GitHub metadata surfaced on projects.
 *
 * Pure functions, no Angular dependencies — safe to call from component
 * methods, inline template expressions (via the component's protected
 * wrapper), specs, and build-time scripts alike. All accept nullable
 * input and return `''` (empty string) when the input would render as
 * noise, so templates can gate on the result with a single `@if`.
 */

/** A single language segment from `GithubMeta.languagesBytes`. */
export interface LanguageSegment {
  readonly name: string;
  readonly bytes: number;
}

/**
 * Human-readable "last pushed" pill value. Under a day → `"today"`,
 * under a month → `"Nd ago"`, under a year → `"Nmo ago"`, older → the
 * four-digit year. Returns `''` when the input is missing or
 * unparseable so the template can hide the pill with `@if (rt; as …) {}`.
 */
export function relativeTime(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Math.max(0, now - then);
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return String(new Date(iso).getUTCFullYear());
}

/**
 * Compact "127" / "1.2k" / "12k" formatter for star & fork counts so
 * the pill stays fixed-width regardless of scale. Returns `''` for
 * null/undefined so the caller can hide the pill entirely.
 */
export function compactNumber(value: number | null | undefined): string {
  if (value == null) return '';
  if (value < 1000) return String(value);
  if (value < 10_000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value / 1000)}k`;
}

/**
 * Percent (as a `"42.3%"` string) for a single language segment in the
 * distribution bar. Computed against the sum of *visible* segments so
 * a truncated list still reads correctly. Returns `''` when the total
 * is zero to hide a confusing `"0.0%"` on edge cases.
 */
export function languagesPercent(
  segments: readonly LanguageSegment[] | undefined,
  name: string,
): string {
  if (!segments?.length) return '';
  const total = segments.reduce((acc, s) => acc + (s.bytes ?? 0), 0);
  if (total === 0) return '';
  const bytes = segments.find((s) => s.name === name)?.bytes ?? 0;
  return `${((bytes / total) * 100).toFixed(1)}%`;
}

/**
 * Flat `"TypeScript 72.1%, HTML 18.4%, CSS 9.5%"` string used for the
 * bar's `aria-label`. Screen readers announce the whole distribution
 * in one pass rather than having to step through every segment.
 */
export function languagesBarLabel(segments: readonly LanguageSegment[] | undefined): string {
  if (!segments?.length) return '';
  return segments.map((s) => `${s.name} ${languagesPercent(segments, s.name)}`).join(', ');
}
