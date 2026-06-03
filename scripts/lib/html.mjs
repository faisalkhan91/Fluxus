/**
 * XML/HTML escaping helpers shared by the feed/sitemap/OG-card/meta writers.
 *
 * Two variants so callers pick the right one for the context:
 *   - `escapeXmlText` for element text content (`&`, `<`, `>`).
 *   - `escapeXmlAttr`  for attribute values (also escapes `"`, and `>` for
 *     a fully-canonical attribute escape).
 *
 * `&` is always replaced first so we never double-escape an entity we just
 * introduced.
 */

/** Escape `&`, `<`, `>` for use as XML/HTML element text content. */
export function escapeXmlText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Escape `&`, `<`, `>`, `"` for use inside a double-quoted attribute value. */
export function escapeXmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
