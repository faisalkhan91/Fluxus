/**
 * Call `el.scrollIntoView(options)` only when `el` exists and actually
 * implements `scrollIntoView`. JSDOM (unit tests) and a few old webviews
 * don't ship the method, so this stays a clean no-op there instead of
 * throwing mid-interaction. Defaults to `{ block: 'nearest' }` — the
 * no-op-when-already-visible variant shared by the command palette and the
 * mobile nav drawer.
 */
export function scrollIntoViewIfPresent(
  el: Element | null | undefined,
  options: ScrollIntoViewOptions = { block: 'nearest' },
): void {
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView(options);
  }
}
