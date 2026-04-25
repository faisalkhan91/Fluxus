# Fluxus

![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular)
![License](https://img.shields.io/badge/License-MIT-blue)
![Docker](https://img.shields.io/badge/Docker-nginx--unprivileged-2496ED?logo=docker)
![Deploy](https://img.shields.io/badge/Deploy-Kubernetes-326CE5?logo=kubernetes)

A personal portfolio site built with Angular 21, styled as a code-editor workspace. The entire application is statically generated (SSG) and served from a hardened NGINX container on Kubernetes.

**Live:** [faisalkhan.dpdns.org](https://faisalkhan.dpdns.org)

<video src="src/assets/images/fluxus-demo.mp4" width="100%" autoplay loop muted playsinline></video>

---

## Tech Stack

| Layer      | Technology                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Framework  | Angular 21.2.7 (standalone components, signals, zoneless, `OnPush`)                              |
| Rendering  | SSG via `@angular/ssr` — the entire route tree is prerendered at build time                      |
| Styling    | Scoped component CSS + global design tokens (`src/styles.css`)                                   |
| Blog       | Markdown files rendered via `marked` + `highlight.js`                                            |
| Container  | Multi-stage Docker — `node:24-alpine` builder, `nginxinc/nginx-unprivileged:1.27-alpine` runtime |
| Web Server | NGINX with gzip, granular cache policies, and full security headers                              |
| Language   | TypeScript 5.9 (strict mode, no `any`)                                                           |

## Features

- **Glass Workspace UI** — Glassmorphism design system with `backdrop-filter`, custom design tokens, dark/light mode
- **Static Site Generation** — All routes prerendered at build time for instant load and SEO
- **Blog Engine** — Markdown posts with anchor IDs, copy-button code blocks, reading progress bar, prev/next + breadcrumb navigation, share row, "Edit on GitHub" deep link, and a `/blog/tag/:tag` archive
- **Auto-generated assets** — Per-post Open Graph card PNGs, Atom feed (`/feed.xml`), sitemap (`/sitemap.xml`), and image dimensions for CLS-safe markdown images
- **Structured data** — Site-wide `Person` + `WebSite` JSON-LD; per-post `BlogPosting` + `BreadcrumbList`
- **Adaptive Favicon** — SVG favicon with dark/light mode support, multi-size ICO, apple-touch-icon, PWA manifest icons
- **Full SEO** — Per-route `<title>`, `og:*`, `twitter:*` meta tags, canonical URLs
- **Accessibility** — Skip-to-content + skip-to-nav links, WCAG AA focus styles, ARIA attributes on all interactive elements, focus trap on the mobile menu
- **Cmd+K command palette** — Site-wide search over routes + blog posts, no third-party deps
- **Incremental hydration** — Below-fold blocks (hero "latest posts") deferred via `@defer (hydrate on viewport)` to slim TBT
- **Service Worker** — `@angular/service-worker` precaches the app shell and lazy-caches blog posts + images for offline reading
- **Web Vitals telemetry** — `web-vitals` lib, lazy-loaded; logs CLS / INP / LCP / FCP / TTFB to console in dev and beacons to a self-hosted endpoint in prod when configured
- **Modern CSS** — OKLCH accent palette, container queries on the content shell, scroll-driven reading-progress animation (zero-JS where supported)
- **Print stylesheet** — Resume / blog post print-friendly view (chrome hidden, black-on-white, prose expanded)
- **Security Headers** — CSP (script-src hashed at build time, no `'unsafe-inline'` for scripts), HSTS preload, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Comprehensive Test Suite** — 250+ Vitest specs (with `posts.json` and nav-routes contract tests), Playwright a11y + behaviour suite, opt-in visual regression, Lighthouse CI in GitHub Actions
- **Automated CI/CD** — single-check CI gate, CodeQL SAST, Release Please semver, multi-arch Docker publish, GitOps PR to Homelab, Trivy gate plus weekly drift re-scan, scheduled smoke probe, weekly GHCR retention

---

## Quick Start

```bash
git clone https://github.com/faisalkhan91/Fluxus.git
cd Fluxus
npm install
ng serve --port 4300
```

Open `http://localhost:4300/` in your browser.

### Prerequisites

- Node.js 22+ (or 24 LTS)
- npm
- Angular CLI 21+ (`npm install -g @angular/cli@latest`)
- Docker (for containerized builds)

---

## Build

### Production (SSG + asset generation)

```bash
npm run build:prod
```

This runs the full build pipeline in order:

1. `node scripts/build-image-dims.mjs` — sweeps `src/assets/images/` with `sharp` and writes intrinsic width/height for every image into `src/app/core/services/image-dims.generated.ts`. The MarkdownService renderer reads this map so blog `<img>` tags ship with `width` / `height` / `loading="lazy"` / `decoding="async"` (no CLS).
2. `ng build --configuration production` — Angular SSG build with the service worker (`ngsw-config.json`) included.
3. `node scripts/inject-meta.mjs` — rewrites per-route `<title>`, description, canonical, and Open Graph / Twitter tags. Blog posts also get JSON-LD `BlogPosting` + `BreadcrumbList`.
4. `node scripts/build-sitemap.mjs` — regenerates `dist/fluxus/browser/sitemap.xml` from `posts.json` + the static route list (no manual sitemap maintenance).
5. `node scripts/build-feed.mjs` — emits `dist/fluxus/browser/feed.xml` (Atom 1.0).
6. `node scripts/build-og-cards.mjs` — renders a 1200×630 PNG OG card per blog post that lacks an explicit `cover` field.
7. `node scripts/build-csp.mjs` — hashes every inline `<script>` in the prerendered HTML and writes `dist/fluxus/security-headers.conf`. The Docker image consumes that file so the production CSP can stay strict (no `'unsafe-inline'` for scripts).

Build output goes to `dist/fluxus/browser/` — 18 prerendered static routes (8 top-level + 4 blog posts + every unique `/blog/tag/:tag`) as directories with `index.html` inside each, plus `feed.xml`, `sitemap.xml`, `og/<slug>.png`, and the SW manifests.

## Docker

### Build the image

```bash
docker build -t fluxus .
```

### Run locally

```bash
docker run --rm -p 8080:8080 fluxus
```

Open `http://localhost:8080/` in your browser.

The container runs as non-root (UID 101) on port 8080, ready for Kubernetes deployment with `readOnlyRootFilesystem: true` and all capabilities dropped.

The image includes a `HEALTHCHECK` that polls `/healthz` every 30 seconds, so Docker reports container health without relying on an external orchestrator.

Multi-architecture builds (`linux/amd64`, `linux/arm64`) are produced automatically on every tagged release.

---

## Testing

Unit tests use [Vitest](https://vitest.dev/) with `jsdom`:

```bash
npm test              # watch mode
npm test -- --watch=false  # single run (CI)
```

---

## Quality gates

Six layered checks guard the build. The CI workflow runs lint, typecheck, audit, unit tests, build, Playwright, and Lighthouse on every PR; the prerender audit runs locally before a release tag.

| Gate                         | Command                                                | What it catches                                                                                    |
| ---------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Unit tests                   | `npm test -- --watch=false`                            | 250+ Vitest specs (components, services, blog content + nav-routes contract tests)                 |
| Static analysis              | `npm run lint` &nbsp;·&nbsp; `npm run typecheck`       | ESLint, Angular template rules, strict TypeScript                                                  |
| Prerender audit (post-build) | `npm run audit:prerender` (after `npm run build:prod`) | SSR regressions: empty `<h1>`s, missing OG/canonical/twitter meta, broken tab buttons, FOUC script |
| Live a11y / behaviour        | `npm run e2e` (after `npm run build:prod`)             | axe (WCAG AA), focus trap, theme pre-paint, View Transitions, `prefers-reduced-motion`             |
| Visual regression (opt-in)   | `npm run e2e:visual` (after `npm run build:prod`)      | Per-route × theme × viewport screenshot baselines under `tests/e2e/visual.spec.ts-snapshots/`      |
| Lighthouse CI                | `lighthouserc.json` runs in GitHub Actions on every PR | Performance / a11y / best-practices / SEO category thresholds + LCP / CLS / TBT budgets            |

The `e2e` pass uses [Playwright](https://playwright.dev/) + [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright). On a fresh checkout, install the chromium browser binary once:

```bash
npm run e2e:install
```

Then build the site and run the pass:

```bash
npm run build:prod
npm run e2e                # headless behaviour suite (default)
npm run e2e:ui             # interactive UI mode for debugging
npm run e2e:visual         # opt-in visual regression run
npm run e2e:visual:update  # refresh visual baselines after intended changes
```

Tests live in `tests/e2e/` and run against the prerendered output served via `http-server` on `:4300`.

### Bundle analyzer

Spot-check what's in the JS chunks (mostly used to catch regressions like a heavy lib leaking into the home route):

```bash
npm run analyze
```

That builds with source maps and opens [`source-map-explorer`](https://github.com/danvk/source-map-explorer) on the main + chunk bundles in your default browser.

---

## CI/CD

| Workflow           | Trigger                                                  | What it does                                                                                                                                                             |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CI**             | PR + push to `main`                                      | Lint, typecheck, audit, unit tests + coverage, production build, Playwright, Lighthouse, plus a `CI success` fan-in check                                                |
| **CodeQL**         | PR + push to `main`, weekly schedule                     | SAST on app code (`javascript-typescript`) and workflow YAML (`actions`)                                                                                                 |
| **Release Please** | Push to `main`                                           | Opens / updates a release PR; only `feat:` / `fix:` / breaking changes bump the version                                                                                  |
| **Publish image**  | Tag `v*` OR push to `main` touching `src/assets/blog/**` | Multi-arch Docker build, single-pass Trivy gate, GitOps PR to Homelab. Tag pushes ship versioned releases; blog pushes ship `content-<sha>` images without a SemVer bump |
| **Trivy re-scan**  | Weekly schedule                                          | Scans the published `latest` image without `.trivyignore` to surface CVE drift                                                                                           |
| **Smoke**          | Manual + daily schedule                                  | Polls `/healthz` on the deployed site                                                                                                                                    |
| **GHCR retention** | Weekly schedule + manual                                 | Prunes old `content-<sha>` images (keeps the 10 most recent) and untagged orphan layers; release tags (`vX.Y.Z`, `X.Y`, `latest`) are kept forever                       |

### Release conventions

| Commit type              | Release Please          | Publish image                               | Result                                                  |
| ------------------------ | ----------------------- | ------------------------------------------- | ------------------------------------------------------- |
| `feat: ...` / `fix: ...` | Opens release PR        | Runs on the `vX.Y.Z` tag after merge        | New SemVer release, GitOps PR labelled `release`        |
| `docs(blog): ...`        | Silent                  | Runs on the main push if blog files changed | New `content-<sha>` image, GitOps PR labelled `content` |
| `chore:` / `refactor:`   | Silent (changelog only) | No                                          | No deploy until the next `feat:` / `fix:`               |

Image tags in GHCR:

- `vX.Y.Z`, `X.Y`, `latest` — produced by release publishes (kept forever)
- `content-<short-sha>` — produced by blog content publishes (auto-pruned by the GHCR retention workflow)

**Dependabot** is configured for weekly updates across npm, Docker, and GitHub Actions dependencies, with grouping for Angular and ESLint packages.

All base images in the Dockerfile are pinned by SHA256 digest for reproducible builds. The CI workflows pin every action by commit SHA.

---

<details>
<summary><strong>Project Structure</strong></summary>

```
src/
├── app/
│   ├── core/
│   │   ├── services/          # BlogService, SeoService, ThemeService, etc.
│   │   └── shell/             # Main layout (sidebar + tab bar + content + mobile nav)
│   ├── features/
│   │   ├── hero/              # Landing page
│   │   ├── about/             # About section
│   │   ├── experience/        # Work timeline
│   │   ├── skills/            # Technical skills grid
│   │   ├── projects/          # Project showcase
│   │   ├── certifications/    # Certification cards
│   │   ├── contact/           # Contact form
│   │   ├── blog/              # Blog index + post viewer
│   │   └── not-found/         # Glitch terminal 404 page
│   ├── ui/                    # Reusable components (glass-card, glow-button, sidebar, etc.)
│   └── shared/                # Shared utilities
├── assets/
│   ├── blog/
│   │   ├── posts.json         # Blog post manifest
│   │   └── posts/             # Markdown blog posts
│   ├── icons/                 # PWA icons, skill icons
│   └── images/                # Profile, portfolio, certification images
├── styles.css                 # Global design tokens
└── index.html                 # App shell with meta tags, font loading, favicon links
```

</details>

<details>
<summary><strong>Routes</strong></summary>

| Route             | Component               | SSG                        |
| ----------------- | ----------------------- | -------------------------- |
| `/`               | HeroComponent           | Prerendered                |
| `/about`          | AboutComponent          | Prerendered                |
| `/experience`     | ExperienceComponent     | Prerendered                |
| `/skills`         | SkillsComponent         | Prerendered                |
| `/projects`       | ProjectsComponent       | Prerendered                |
| `/certifications` | CertificationsComponent | Prerendered                |
| `/contact`        | ContactComponent        | Prerendered                |
| `/blog`           | BlogComponent           | Prerendered                |
| `/blog/:slug`     | BlogPostComponent       | Prerendered (dynamic)      |
| `**`              | NotFoundComponent       | Client-side (CSR fallback) |

</details>

<details>
<summary><strong>Blog Authoring</strong></summary>

Posts are Markdown files in `src/assets/blog/posts/`. Metadata lives in `src/assets/blog/posts.json`:

```json
{
  "slug": "my-post",
  "title": "My Post Title",
  "date": "2026-04-01",
  "excerpt": "A short description.",
  "tags": ["angular", "typescript"],
  "readingTime": "5 min read"
}
```

The post-build script `scripts/inject-meta.mjs` injects per-route and post-specific OG/Twitter meta into each prerendered HTML file.

Image assets dropped into `src/assets/images/blog/<post>/` can be optimized in-place to WebP via:

```bash
npm run optimize:images           # write .webp siblings, keep originals
npm run optimize:images -- --replace   # replace .jpg/.png originals with .webp
```

The script is idempotent — re-running skips already-optimized files. Remember to update markdown image extensions to `.webp` after using `--replace`.

</details>

---

## Author

**Faisal Khan**

- GitHub: [@faisalkhan91](https://github.com/faisalkhan91)
- LinkedIn: [Faisal Khan](https://linkedin.com/in/faisalkhan91)

## License

MIT — see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of releases.
