/**
 * Single source of truth for the NON-CSP security headers shared by:
 *   - the generated production headers (scripts/build-csp.mjs ->
 *     dist/fluxus/security-headers.conf, copied into the Docker image), and
 *   - the hand-checked dev / local-serve fallback (security-headers.conf).
 *
 * These two files historically drifted — the fallback carried a 3-directive
 * Permissions-Policy while production shipped 13, an undocumented dev/prod
 * security mismatch. Defining the block once here makes that impossible:
 * build-csp.mjs emits exactly this string, and audit-csp.mjs asserts the
 * committed fallback's non-CSP `add_header` lines match it (so the fallback
 * can't silently fall behind again).
 *
 * The Content-Security-Policy line is deliberately NOT here: production computes
 * it from per-inline-script SHA-256 hashes (build-csp.mjs); the dev fallback
 * uses a fixed permissive CSP. Everything else is identical across both.
 */
export const STATIC_SECURITY_HEADERS = `add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), autoplay=(), browsing-topics=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
# Cross-origin isolation pair. Both are 'same-origin' because the site
# doesn't load any cross-origin embeds: COOP locks the browsing context
# group so window.opener interactions from cross-origin popups can't
# reach in (Spectre / cross-origin info-leak defence), and CORP narrows
# which sites can fetch this origin's resources to same-origin only —
# blocking cross-origin <img>/<script> hotlinks that would otherwise
# leak content via the browser's resource-load timing side channels.
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;`;

/**
 * The non-CSP `add_header` directive lines from a conf string, trimmed and with
 * comment/blank lines dropped — the comparable surface for drift detection.
 */
export function nonCspAddHeaderLines(conf) {
  return conf
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('add_header') && !/Content-Security-Policy/i.test(line));
}
