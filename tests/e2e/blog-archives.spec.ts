import { expect, test } from './fixtures';

/**
 * Blog listing + tag-archive gating. The published surfaces (the /blog
 * index and every /blog/tag/:tag archive) must exclude drafts and
 * future-dated posts, while those posts stay reachable at their own URL
 * for author preview — carrying noindex,nofollow so a crawler never
 * indexes an unpublished page. Build scripts (inject-meta, build-sitemap)
 * and BlogService enforce this; these tests prove it end to end against
 * the prerendered output.
 */
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
    await page.goto('/blog', { waitUntil: 'networkidle' });
    // Draft.
    await expect(page.locator('a[href*="/blog/blog-post-template"]')).toHaveCount(0);
    // Future-dated (publishes 2026-06-16).
    await expect(
      page.locator('a[href*="/blog/self-healing-needs-a-human-in-the-loop"]'),
    ).toHaveCount(0);
    // A published post IS listed.
    await expect(page.locator('a[href*="/blog/why-we-didnt-use-kafka"]').first()).toBeVisible();
  });

  test('a future-dated post is still reachable at its URL but marked noindex', async ({ page }) => {
    await page.goto('/blog/self-healing-needs-a-human-in-the-loop-2026-05', {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex,nofollow',
    );
  });
});
