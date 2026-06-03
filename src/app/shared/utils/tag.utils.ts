import { slugify } from '@shared/utils/string.utils';

/**
 * Tag-archive helpers shared by `BlogTagComponent` and `ProjectsTagComponent`,
 * which resolve a slugified `/…/tag/:tag` URL segment back against a collection.
 * Both compare on `slugify(tag)` so `/blog/tag/ci-cd` matches `CI/CD` or
 * `ci/cd` in the source data. `getTags` adapts each item to its tag list so
 * the same logic serves `BlogPost` and `Project`.
 */

/**
 * The display label for a tag slug = the original-cased spelling from the
 * first item whose tag slugifies to `slug` (so headings read "CI/CD" rather
 * than "ci-cd"). Falls back to the slug itself when nothing matches, and
 * returns '' for an empty slug. First-match order is preserved.
 */
export function resolveTagLabel<T>(
  items: readonly T[],
  getTags: (item: T) => readonly string[],
  slug: string,
): string {
  if (!slug) return '';
  for (const item of items) {
    const match = getTags(item).find((t) => slugify(t) === slug);
    if (match) return match;
  }
  return slug;
}

/** Items that carry at least one tag whose slug equals `slug` (order preserved). */
export function filterByTagSlug<T>(
  items: readonly T[],
  getTags: (item: T) => readonly string[],
  slug: string,
): T[] {
  if (!slug) return [];
  return items.filter((item) => getTags(item).some((t) => slugify(t) === slug));
}
