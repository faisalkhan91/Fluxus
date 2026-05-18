/**
 * Shared, dependency-free helpers for blog content.
 *
 * Both the Angular components and the Node-side build scripts (sitemap, RSS,
 * inject-meta) can call these without dragging in HttpClient or DI.
 */

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/**
 * Formats an ISO date string as "Month D, YYYY" in en-US.
 *
 * Posts.json dates are date-only strings (`YYYY-MM-DD`). `new Date('YYYY-MM-DD')`
 * parses them as UTC midnight and `Intl.DateTimeFormat` then formats them in
 * the viewer's local timezone, which prints the *previous* calendar day for
 * anyone west of UTC (and flips the day on the prerender server too). We parse
 * the components manually as local-midnight so the displayed day always
 * matches the author-intended date and the `<time datetime>` attribute.
 *
 * Returns the original string when parsing fails so the UI never shows
 * "Invalid Date" — a JSON typo surfaces unchanged for the author to spot.
 */
export function formatPostDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match) {
    const [, y, m, d] = match;
    return DATE_FORMATTER.format(new Date(Number(y), Number(m) - 1, Number(d)));
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return DATE_FORMATTER.format(parsed);
}
