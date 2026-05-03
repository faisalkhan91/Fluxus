import { expect, seedTheme, test } from './fixtures';

/**
 * The inline pre-paint <script> in src/index.html is the *only* thing that
 * sets `data-theme` synchronously, before Angular hydrates. If a future
 * change accidentally moves it to an Angular effect / app initializer,
 * users will see a flash on the first paint (FOUC). These tests catch
 * that regression by asserting the attribute is present immediately
 * after `goto()`, with no Angular bootstrap allowed in between.
 *
 * The pre-paint script is also responsible for two cross-version contracts:
 *   - Migrating legacy `'dark'` / `'light'` values to the new
 *     `crimson-dark` / `crimson-light` registry ids.
 *   - Validating the stored value against an inline allowlist mirroring
 *     THEME_REGISTRY (any unknown value falls back to the system pref).
 */
test.describe('theme pre-paint (no FOUC)', () => {
  test('seeded crimson-light is applied synchronously by the pre-paint script', async ({
    page,
  }) => {
    await seedTheme(page, 'crimson-light');
    await page.goto('/');

    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(dataTheme).toBe('crimson-light');
  });

  test('seeded crimson-dark is applied synchronously (attribute is always set)', async ({
    page,
  }) => {
    await seedTheme(page, 'crimson-dark');
    await page.goto('/');

    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    // Unlike the legacy contract (where the dark default left the attribute
    // unset), the multi-theme registry writes the active id unconditionally
    // so CSS `[data-theme=...]` rules can rely on it being present.
    expect(dataTheme).toBe('crimson-dark');
  });

  test('legacy "light" value migrates to crimson-light on first paint', async ({ page }) => {
    await seedTheme(page, 'light');
    await page.goto('/');

    const result = await page.evaluate(() => ({
      dataTheme: document.documentElement.getAttribute('data-theme'),
      stored: localStorage.getItem('theme'),
    }));
    expect(result.dataTheme).toBe('crimson-light');
    // The pre-paint script also rewrites storage so subsequent loads take
    // the validated-id fast path without re-doing the migration.
    expect(result.stored).toBe('crimson-light');
  });

  test('legacy "dark" value migrates to crimson-dark on first paint', async ({ page }) => {
    await seedTheme(page, 'dark');
    await page.goto('/');

    const result = await page.evaluate(() => ({
      dataTheme: document.documentElement.getAttribute('data-theme'),
      stored: localStorage.getItem('theme'),
    }));
    expect(result.dataTheme).toBe('crimson-dark');
    expect(result.stored).toBe('crimson-dark');
  });

  test('any non-default registry id is honoured (e.g. tokyo-night)', async ({ page }) => {
    await seedTheme(page, 'tokyo-night');
    await page.goto('/');

    const dataTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(dataTheme).toBe('tokyo-night');
  });

  test('the inline pre-paint script lives in <head> and references theme storage', async ({
    page,
  }) => {
    await page.goto('/');
    const inlineScripts = await page.$$eval('head script:not([src])', (els) =>
      els.map((el) => el.textContent ?? ''),
    );
    const prePaint = inlineScripts.find(
      (src) => src.includes("localStorage.getItem('theme')") || src.includes('data-theme'),
    );
    expect(prePaint).toBeTruthy();
    // Smoke-check the allowlist exists so a future refactor can't strip
    // the contract test's anchor.
    expect(prePaint).toContain('THEME_IDS');
  });
});

/**
 * End-to-end exercise of the runtime picker path: open the command
 * palette, type "tokyo", press Enter, and assert the DOM, storage, and
 * `<meta name="theme-color">` tags all swap in lockstep. This is the
 * single source of truth that the user-facing picker actually wires
 * everything together — unit tests verify each piece in isolation, this
 * spec proves they compose.
 */
test.describe('command palette → theme switch', () => {
  test('Cmd+K → "tokyo" → Enter swaps data-theme, storage, and meta theme-color', async ({
    page,
  }) => {
    await seedTheme(page, 'crimson-dark');
    await page.goto('/', { waitUntil: 'networkidle' });

    expect(
      await page.evaluate(() => document.documentElement.getAttribute('data-theme')),
    ).toBe('crimson-dark');

    // Cmd+K toggles on macOS; Ctrl+K is the cross-platform alias the
    // component listens for. Use Control here so the spec passes on the
    // Linux CI runner without OS sniffing.
    await page.keyboard.press('Control+K');
    const input = page.locator('.palette-input');
    await expect(input).toBeFocused();
    await input.fill('tokyo');
    await page.keyboard.press('Enter');

    // The setTheme() effect updates the DOM synchronously after the
    // signal write; await the resulting attribute change explicitly so
    // the assertion isn't racing with Angular's microtask flush.
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.getAttribute('data-theme')))
      .toBe('tokyo-night');

    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('tokyo-night');

    // The dark-scheme `<meta name="theme-color">` should now carry Tokyo
    // Night's surface void (#1a1b26). The light-scheme one is left alone
    // so a system swap back to "match light" still surfaces a sensible
    // chrome colour.
    expect(
      await page.evaluate(
        () =>
          document
            .querySelector('meta[name="theme-color"][media*="dark"]')
            ?.getAttribute('content') ?? '',
      ),
    ).toBe('#1a1b26');
  });
});
