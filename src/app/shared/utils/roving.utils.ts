/**
 * Roving-tabindex helpers for ARIA `radiogroup` / `tablist` keyboard nav,
 * shared by ProjectsComponent (sort + view toggles), SkillsComponent (view
 * toggle), and EditorTabBarComponent (tab strip). Arrow keys wrap around the
 * option list and move focus to the newly-active control.
 */

/** Index after moving `dir` (±1) from `currentIndex`, wrapping within `length`. */
export function rovingNext(currentIndex: number, dir: -1 | 1, length: number): number {
  return (currentIndex + dir + length) % length;
}

/**
 * Focus the `index`-th element matching `selector` within `host`. Used after
 * a roving move; `.focus()` ignores the element's (possibly `-1`) tabindex,
 * which catches up on the next change-detection pass. No-op when the index
 * is out of range.
 */
export function focusByIndex(host: HTMLElement, selector: string, index: number): void {
  host.querySelectorAll<HTMLElement>(selector)[index]?.focus();
}
