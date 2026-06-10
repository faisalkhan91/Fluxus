# Security Policy

## Reporting a vulnerability

If you find a security issue in Fluxus, please report it privately rather than opening a public
issue:

- **Email:** faisalkhan91@gmail.com (subject prefix `[security]`)
- Or use GitHub's **private vulnerability reporting** (Security → Report a vulnerability).

Please include reproduction steps and the affected URL/commit. I aim to acknowledge within a few
days. There is no bug-bounty program — this is a personal site — but credit is given for valid
reports. The machine-readable contact is published at
[`/.well-known/security.txt`](https://faisalkhan.dpdns.org/.well-known/security.txt) (RFC 9116).

## Supported versions

Only the currently deployed `main` build is supported; there are no released/maintained branches.

## Security posture

Fluxus is a **fully prerendered static site** served by an unprivileged NGINX container — there is
**no application server or database at runtime**, which removes most classic web attack surface.

- **CSP:** generated at build time with a per-inline-script SHA-256 allowlist; `script-src` is strict
  (no `unsafe-inline`). The build **fails** if the CSP would exceed NGINX's header limit.
- **Headers:** HSTS (preload), COOP + CORP (`same-origin`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, a locked-down `Permissions-Policy`. The non-CSP block has a
  single source of truth (`scripts/lib/headers.mjs`) with a build-time drift guard.
- **Content trust boundary:** only locally-authored Markdown is trusted (`TrustedHtmlPipe` accepts a
  single `'local-markdown'` source); raw HTML is escaped and link/image hrefs are scheme-checked.
  Mermaid runs with `securityLevel: 'strict'`.
- **Supply chain:** all GitHub Actions are SHA-pinned; Dependabot + Trivy + CodeQL run in CI;
  published images carry OCI provenance (`mode=max`) + SBOM.

## Deliberate non-adoptions

These are commonly-recommended hardening features we have **intentionally not** implemented, with the
rationale — documented so they aren't repeatedly re-litigated:

- **Trusted Types (`require-trusted-types-for 'script'`)** — defends DOM-XSS sinks
  (`innerHTML`/`eval`) fed by untrusted input. Fluxus is static-prerendered with a single
  locally-authored content path and a strict script-src, so the marginal benefit is low. Revisit if
  user-generated or CMS-fed content is ever introduced.
- **CSP violation reporting (`report-to` / `Reporting-Endpoints`)** — requires a backend collector,
  which a static, no-runtime site doesn't have. Build-time `audit-csp` already catches the failure
  mode (a hash that doesn't match what the prerender emits) before deploy.
- **OpenSSF Scorecard / Sigstore (cosign) image signing** — Scorecard's checks are largely already
  satisfied operationally (pinned actions, CodeQL, Trivy, Dependabot, signed commits), and cosign
  keyless signing only adds value with consumer-side verification, which this single-consumer
  homelab deploy doesn't enforce. OCI provenance + SBOM are already attached.
