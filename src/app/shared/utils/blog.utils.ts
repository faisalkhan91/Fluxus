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
 * Returns the original string when parsing fails so the UI never shows
 * "Invalid Date" — a JSON typo surfaces unchanged for the author to spot.
 */
export function formatPostDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return DATE_FORMATTER.format(parsed);
}
