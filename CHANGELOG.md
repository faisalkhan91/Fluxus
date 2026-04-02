# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-stage Dockerfile with `node:24-alpine` builder and `nginxinc/nginx-unprivileged:1.27-alpine` runtime (non-root UID 101, port 8080)
- BuildKit optimizations: `# syntax=docker/dockerfile:1`, `--mount=type=cache` for npm, `COPY --link` for layer independence
- OCI image labels (`org.opencontainers.image.*` metadata)
- `.dockerignore` excluding `.git`, `.angular`, `.vscode`, `.cursor`, `.gemini`, `node_modules`, `dist`, root-level `*.md`
- Adaptive SVG favicon with `>fk_` prompt mark and dark/light mode via `prefers-color-scheme`
- Multi-size `favicon.ico` (16/32/48), `apple-touch-icon.png` (180px), PWA manifest icons (192/512)

### Changed

- Rewrote `nginx.conf` with SSG-aware routing (`try_files $uri $uri/index.html =404`), gzip compression, granular cache policies, custom 404 via CSR shell, and `server_tokens off`
- Cache strategy: immutable 1-year cache for content-hashed JS/CSS and fonts; 1-year cache for images; `no-cache` for HTML, `posts.json`, `site.webmanifest`, `sitemap.xml`, `robots.txt`
- Disabled font inlining (`optimization.fonts: false` in `angular.json`) to eliminate build-time network dependency on Google Fonts
- Updated Angular to 21.2.7, RxJS to 7.8.2, Express to 5.2.1
- Rewrote `README.md` and `CHANGELOG.md` to follow 2026 best practices

### Fixed

- Resolved `NotYetImplemented` error in `IconComponent` during SSG prerendering
- Custom 404 now returns HTTP 404 status: `index.csr.html` copied as `404.html` so Angular boots client-side and renders the glitch NotFoundComponent

### Security

- Added CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers in every NGINX location block

## [1.2.0] - 2026-04-01

### Added

- SEO suite: per-route `<title>`, `og:*`, `twitter:*` meta tags, canonical URLs, `sitemap.xml`, `robots.txt`
- Blog engine with Markdown posts, syntax-highlighted code blocks, reading progress bar, and prev/next navigation
- Post-build script (`scripts/inject-blog-meta.mjs`) to inject post-specific OG/Twitter tags into prerendered blog HTML
- Blog posts: Angular Signals state management, Cloud-Native CI/CD pipelines, and a blog post template
- Skip-to-content link, `id="main-content"` on `<main>`, WCAG AA focus styles, ARIA attributes on all interactive elements
- Noscript fallback in `index.html`
- Web manifest (`src/site.webmanifest`) with PWA metadata
- Google Fonts loading via `<link rel="preconnect">` + `<link rel="stylesheet">`

## [1.1.1] - 2026-03-31

### Added

- SSG (Static Site Generation) via `outputMode: "static"` with 12 prerendered routes
- Glass Workspace design system with glassmorphism surfaces, sidebar, editor tab bar, and mobile nav pill
- Design tokens as CSS custom properties for surfaces, glass, accent, typography, spacing, and transitions
- Dark/light mode via `ThemeService` with `[data-theme]` attribute on `<html>`
- Reusable UI components: `glass-card`, `glass-panel`, `glow-button`, `sidebar`, `mobile-nav-pill`, `editor-tab-bar`, `icon`, `section-header`, `skill-badge`, `timeline`, `bottom-sheet`
- Navigation services: `TabService`, `NavigationService`, `MediaQueryService` with reactive breakpoint signals
- Initial Dockerfile and NGINX config for containerized deployment
- GitHub Actions workflow for Docker publish
- Gemini coding conventions file

### Changed

- Migrated from Angular 18 to Angular 21.2.6
- Rewrote architecture to standalone components, signals, `OnPush` change detection, `inject()`, `input()`/`output()` functions
- Refactored header and profile components for design consistency
- Restructured lazy-loaded feature routes inside `ShellComponent`

## [1.1.0] - 2025-09-05

### Changed

- Upgraded from Angular 16 to Angular 18.2.13
- Updated TypeScript to 5.4.5 with ES2022 target
- Updated Angular CLI to 18.2.20
- Relocated project from subdirectory to root
- Refactored CSS for profile overview, skills, and interests components
- Consolidated profile component styles into main stylesheet
- Refactored CSS variables for colors and gradients

## [1.0.0] - 2023-05-06

### Added

- Profile overview, experience, skills, portfolio, and interests components
- Timeline feature for experience component
- Profile navigation with toggle functionality
- Home component layout

## [0.0.0] - 2021-03-29

### Added

- Initial portfolio website built with Angular 16
- Landing page, header, navigation, and profile components
- Responsive design with color scheme iterations
- Routing setup and component styling

[Unreleased]: https://github.com/faisalkhan91/Fluxus/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/faisalkhan91/Fluxus/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/faisalkhan91/Fluxus/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/faisalkhan91/Fluxus/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/faisalkhan91/Fluxus/compare/v0.0.0...v1.0.0
[0.0.0]: https://github.com/faisalkhan91/Fluxus/releases/tag/v0.0.0
