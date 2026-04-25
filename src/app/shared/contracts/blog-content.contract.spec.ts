/**
 * Build-time contract tests for blog content. Runs in vitest (Node), so it can
 * read the actual `posts.json` and the markdown files from disk.
 *
 * The same checks would also fire at `npm run audit:prerender` against the
 * built HTML, but having them as fast unit tests means a typo in a manifest
 * field or a missing `# Title` shows up in CI before the build step.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BlogPost } from '../models/blog-post.model';

const ROOT = join(process.cwd());
const MANIFEST_PATH = join(ROOT, 'src/assets/blog/posts.json');
const POSTS_DIR = join(ROOT, 'src/assets/blog/posts');

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as BlogPost[];

describe('blog content contract — posts.json shape', () => {
  it('parses as a non-empty array', () => {
    expect(Array.isArray(manifest)).toBe(true);
    expect(manifest.length).toBeGreaterThan(0);
  });

  it.each(manifest)('post "$slug" has every required field', (post) => {
    expect(typeof post.slug).toBe('string');
    expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    expect(typeof post.title).toBe('string');
    expect(post.title.length).toBeGreaterThan(0);
    expect(typeof post.date).toBe('string');
    expect(typeof post.excerpt).toBe('string');
    expect(post.excerpt.length).toBeGreaterThan(0);
    expect(Array.isArray(post.tags)).toBe(true);
    expect(post.tags.length).toBeGreaterThan(0);
    expect(typeof post.readingTime).toBe('string');
    expect(post.readingTime.length).toBeGreaterThan(0);
  });

  it.each(manifest)('post "$slug" has a parseable ISO date', (post) => {
    const parsed = new Date(post.date);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });

  it('has unique slugs', () => {
    const slugs = manifest.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('blog content contract — markdown files', () => {
  it.each(manifest)('post "$slug" has a backing .md file', (post) => {
    const path = join(POSTS_DIR, `${post.slug}.md`);
    expect(existsSync(path)).toBe(true);
  });

  it.each(manifest)('post "$slug" body starts with an <h1> (`# Title`)', (post) => {
    const body = readFileSync(join(POSTS_DIR, `${post.slug}.md`), 'utf-8').trimStart();
    // The first non-blank line of the post body must be a level-1 heading so
    // the document outline is correct (and matches the BlogPosting JSON-LD
    // headline). A leading `## ` or plain text would silently demote the
    // page-level h1 — easy to miss without a guard.
    expect(body).toMatch(/^# +\S/);
  });
});
