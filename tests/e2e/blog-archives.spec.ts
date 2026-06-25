import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from './fixtures';

/**
 * Blog listing + tag-archive gating. The published surfaces (the /blog
 * index and every /blog/tag/:tag archive) must exclude drafts and
 * future-dated posts, while those posts stay reachable at their own URL
 * for author preview — carrying noindex,nofollow so a crawler never
 * indexes an unpublished page. Build scripts (inject-meta, build-sitemap)
 * and BlogService enforce this; these tests prove it end to end against
 * the prerendered output.
 *
 * The draft / future-dated fixtures are derived from posts.json at runtime
 * rather than hardcoded: a "future-dated" slug eventually lapses into the
 * past as real time advances, which silently turned this suite red. We pick
 * the *farthest*-future and *farthest*-past published posts so the assertions
 * stay clear of the build/test clock boundary, and skip the future-dated
 * cases gracefully if the content pipeline currently has no future posts.
 */
interface PostMeta {
  slug: string;
  title: string;
  date: string;
  draft?: boolean;
}

const posts: PostMeta[] = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/assets/blog/posts.json'), 'utf8'),
);

const now = Date.now();
const published = posts.filter((p) => !p.draft);
const byDateDesc = (a: PostMeta, b: PostMeta) => Date.parse(b.date) - Date.parse(a.date);

const draftPost = posts.find((p) => p.draft);
// Farthest-future published post — maximally clear of the clock boundary.
const futurePost = published.filter((p) => Date.parse(p.date) > now).sort(byDateDesc)[0];
// Most-recently published (past) post that must always be listed.
const publishedPost = published.filter((p) => Date.parse(p.date) <= now).sort(byDateDesc)[0];

test.describe('blog tag archive', () => {
  test('/blog/tag/architecture lists Architecture posts and excludes the draft template', async ({
    page,
  }) => {
    await page.goto('/blog/tag/architecture', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Architecture/i);
    // A known Architecture-tagged published post is listed.
    await expect(
      page.locator('a[href*="/blog/angular-signals-state-management"]').first(),
    ).toBeVisible();
    // The draft template (tag: Template) is not an Architecture post and
    // must never appear here.
    await expect(page.locator('a[href*="/blog/blog-post-template"]')).toHaveCount(0);
  });
});

test.describe('blog draft / future-dated gating', () => {
  test('the /blog listing hides draft and future-dated posts', async ({ page }) => {
    expect(publishedPost, 'posts.json must contain at least one published post').toBeTruthy();
    await page.goto('/blog', { waitUntil: 'networkidle' });

    if (draftPost) {
      await expect(page.locator(`a[href*="/blog/${draftPost.slug}"]`)).toHaveCount(0);
    }
    if (futurePost) {
      await expect(page.locator(`a[href*="/blog/${futurePost.slug}"]`)).toHaveCount(0);
    }
    // A published post IS listed.
    await expect(page.locator(`a[href*="/blog/${publishedPost.slug}"]`).first()).toBeVisible();
  });

  test('a future-dated post is still reachable at its URL but marked noindex', async ({ page }) => {
    test.skip(!futurePost, 'no future-dated post in posts.json');
    await page.goto(`/blog/${futurePost.slug}`, { waitUntil: 'networkidle' });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex,nofollow',
    );
  });
});
