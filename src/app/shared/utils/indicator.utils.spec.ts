import { describe, it, expect } from 'vitest';
import { readActiveOffset } from './indicator.utils';

/**
 * jsdom doesn't lay out elements (offsetLeft/Width are always 0), so we
 * stub the active element's geometry to assert the axis branching and the
 * null/no-match contract rather than real layout.
 */
function containerWith(active: Partial<HTMLElement> | null): HTMLElement {
  return {
    querySelector: () => active as HTMLElement | null,
  } as unknown as HTMLElement;
}

describe('readActiveOffset', () => {
  it('reads offsetLeft/offsetWidth on the x axis', () => {
    const container = containerWith({
      offsetLeft: 12,
      offsetWidth: 80,
      offsetTop: 5,
      offsetHeight: 20,
    });
    expect(readActiveOffset(container, '.active', 'x')).toEqual({ offset: 12, size: 80 });
  });

  it('reads offsetTop/offsetHeight on the y axis', () => {
    const container = containerWith({
      offsetLeft: 12,
      offsetWidth: 80,
      offsetTop: 5,
      offsetHeight: 20,
    });
    expect(readActiveOffset(container, '.active', 'y')).toEqual({ offset: 5, size: 20 });
  });

  it('returns null when no element matches', () => {
    expect(readActiveOffset(containerWith(null), '.active', 'x')).toBeNull();
  });
});
