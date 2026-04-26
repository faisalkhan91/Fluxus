/**
 * Copies `text` to the system clipboard, returning `true` on success.
 *
 * Two-tier fallback strategy:
 *  1. Modern: `navigator.clipboard.writeText` — async, requires HTTPS or
 *     localhost, can be denied by the user / Permissions Policy.
 *  2. Legacy: `<textarea>` + `document.execCommand('copy')` — works on
 *     insecure-context deployments and older Safari, but only when called
 *     synchronously inside a user-gesture handler.
 *
 * The function is browser-only — it returns `false` immediately on the
 * server (no `document`). Both `BlogPostComponent` (anchor / share / code
 * copy) and `ContactComponent` (email) used to inline near-identical
 * implementations of this; sharing the helper means they fix bugs and
 * accessibility quirks in lock-step.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permissions denied / insecure context — fall through to the
      // execCommand path so insecure deployments and older Safari still
      // get a working "copy" affordance.
    }
  }
  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    /*
      `position: absolute` + a far-offscreen left value keeps the temp
      textarea off-screen without affecting page scroll height (which
      `display: none` would, by triggering a reflow). The textarea also
      avoids tab-order pollution because it's removed before the next
      microtask.
    */
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
