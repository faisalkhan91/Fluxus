/**
 * Shared, dependency-free helpers for blog content.
 *
 * Both the Angular components and the Node-side build scripts (sitemap, RSS,
 * inject-meta) can call these without dragging in HttpClient or DI.
 */

const WORDS_PER_MINUTE = 220;

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/**
 * Estimates a human-friendly reading time from a body of markdown or HTML.
 *
 * Strips common markup so code blocks and image syntax don't inflate the
 * count, then divides word count by an average reading speed (~220 wpm).
 * Always returns at least "1 min" for a non-empty body.
 *
 * NOTE: The runtime no longer calls this — `BlogPostComponent` reads the
 * authoritative `readingTime` straight from the manifest, which is
 * regenerated at build time by `scripts/sync-reading-times.mjs`. That script
 * keeps a 1:1 copy of this implementation so manifest, prerender, and SPA
 * never disagree. Update both together when tweaking the algorithm.
 */
export function computeReadingTime(body: string): string {
  if (!body) return '0 min';
  const text = body
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/<[^>]+>/g, ' ') // HTML tags
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ') // markdown images
    .replace(/\[[^\]]*\]\([^)]+\)/g, ' ') // markdown links (text only)
    .replace(/[#*_`>~|-]+/g, ' '); // residual markdown punctuation
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min`;
}

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
