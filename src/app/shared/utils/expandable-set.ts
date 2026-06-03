import { signal } from '@angular/core';

/** A toggleable set of string keys, backed by a signal. */
export interface ExpandableSet {
  /** True when `key` is currently in the expanded set. */
  isExpanded(key: string): boolean;
  /** Add `key` if absent, remove it if present (immutable signal update). */
  toggle(key: string): void;
}

/**
 * Per-item "expanded" state machine shared by `ProjectsComponent` and
 * `ProjectsTagComponent` (the "Read more" clamp toggle on project cards).
 * Keyed by a unique string (project title). Returns closures rather than
 * methods so a component can expose them directly as `protected` fields
 * without `.bind(this)`.
 */
export function createExpandableSet(): ExpandableSet {
  const set = signal(new Set<string>());
  return {
    isExpanded: (key: string): boolean => set().has(key),
    toggle: (key: string): void =>
      set.update((current) => {
        const next = new Set(current);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      }),
  };
}
