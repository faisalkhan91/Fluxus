import { describe, it, expect } from 'vitest';
import { createMockBlogPost } from './blog-mocks';

describe('createMockBlogPost', () => {
  it('returns a fully-populated BlogPost with sensible defaults', () => {
    const post = createMockBlogPost();
    expect(post.slug).toBe('test-post');
    expect(post.title).toBe('Test Post');
    expect(post.tags).toEqual([]);
    expect(post.readingTime).toBe('3 min');
    expect(post.date).toBe('2026-01-01');
  });

  it('overrides defaults from the partial argument', () => {
    const post = createMockBlogPost({ slug: 'custom', tags: ['ts'] });
    expect(post.slug).toBe('custom');
    expect(post.tags).toEqual(['ts']);
    // Untouched fields keep their defaults.
    expect(post.title).toBe('Test Post');
  });

  it('defensively copies the tags override so callers can mutate without leaking', () => {
    // Mirrors createMockGithubMeta's per-call-fresh array contract.
    const sharedTags = ['initial'];
    const post = createMockBlogPost({ tags: sharedTags });
    sharedTags.push('mutated-after-creation');
    expect(post.tags).toEqual(['initial']);
  });
});
