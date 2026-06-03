import { describe, it, expect } from 'vitest';
import { resolveTagLabel, filterByTagSlug } from './tag.utils';

interface Item {
  tags: string[];
}
// 'CI-CD' and 'ci-cd' both slugify to 'ci-cd' (the '/' in a value like
// 'CI/CD' would instead be stripped to 'cicd' — see string.utils.slugify).
const items: Item[] = [{ tags: ['CI-CD', 'Angular'] }, { tags: ['ci-cd', 'TypeScript'] }];
const getTags = (i: Item) => i.tags;

describe('resolveTagLabel', () => {
  it('returns the first original-cased spelling whose slug matches', () => {
    expect(resolveTagLabel(items, getTags, 'ci-cd')).toBe('CI-CD');
  });

  it('falls back to the slug when nothing matches', () => {
    expect(resolveTagLabel(items, getTags, 'rust')).toBe('rust');
  });

  it('returns an empty string for an empty slug', () => {
    expect(resolveTagLabel(items, getTags, '')).toBe('');
  });
});

describe('filterByTagSlug', () => {
  it('returns every item carrying a tag whose slug matches', () => {
    expect(filterByTagSlug(items, getTags, 'ci-cd')).toEqual(items);
  });

  it('returns only the matching items', () => {
    expect(filterByTagSlug(items, getTags, 'angular')).toEqual([items[0]]);
  });

  it('returns [] for an empty slug', () => {
    expect(filterByTagSlug(items, getTags, '')).toEqual([]);
  });
});
