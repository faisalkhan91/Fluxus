/**
 * Shared geometry read for the "single sliding indicator" pattern used by
 * the editor tab bar (horizontal), the projects sort row (horizontal), and
 * the sidebar nav (vertical). Each component owns its own triggers (route
 * change / active-tab change / resize) and publishes the result as CSS
 * custom properties; this is just the common DOM measurement they all share.
 */

/** `x` reads offsetLeft/offsetWidth; `y` reads offsetTop/offsetHeight. */
export type IndicatorAxis = 'x' | 'y';

export interface IndicatorGeometry {
  /** Distance of the active element from the container's content edge. */
  offset: number;
  /** Active element's size along the axis. */
  size: number;
}

/**
 * Measure the active child (matched by `selector`) within `container` along
 * `axis`. Returns `null` when no element matches — callers treat that as
 * "hide the indicator" (typically by zeroing its size). Reads layout
 * properties, so call only from a browser-only context after render.
 */
export function readActiveOffset(
  container: HTMLElement,
  selector: string,
  axis: IndicatorAxis,
): IndicatorGeometry | null {
  const active = container.querySelector<HTMLElement>(selector);
  if (!active) return null;
  return axis === 'x'
    ? { offset: active.offsetLeft, size: active.offsetWidth }
    : { offset: active.offsetTop, size: active.offsetHeight };
}
