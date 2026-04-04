# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0](https://github.com/faisalkhan91/Fluxus/compare/v1.2.4...v1.3.0) (2026-04-04)


### Features

* Major config changes ([a710005](https://github.com/faisalkhan91/Fluxus/commit/a710005c033a41926d858d406196b3f563c0fbf2))

## [1.3.0](https://github.com/faisalkhan91/Fluxus/compare/v1.2.4...v1.3.0) (2026-04-04)

### Changed

- Migrated from Zone.js-based to zoneless change detection (Angular 21 default) — ~33KB bundle reduction, 30-40% rendering improvement
- Replaced `provideZoneChangeDetection()` with `provideBrowserGlobalErrorListeners()` in app config
- Migrated test runner from Karma/Jasmine to Vitest (Angular 21 default)
- Updated TypeScript from `^5.5.0` to `~5.9.0` (latest supported by Angular 21 toolchain)
- Updated `@types/node` from `^20.17.19` to `^24.12.2`
- Updated `typecheck` script to scope to `tsconfig.app.json`

### Removed

- `zone.js` dependency and polyfill
- `@angular/platform-browser-dynamic` (unused, app uses standalone bootstrap)
- Karma, Jasmine, and related dev dependencies (`karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`, `jasmine-core`, `@types/jasmine`)
- Legacy `karma.conf.js`, `src/test.ts`, `src/polyfills.ts`

### Added

- `vitest` and `jsdom` dev dependencies
- Baseline `app.component.spec.ts` for Vitest
- AI/LLM context files (`.ai/`, `.cursor/rules/`)

## [1.2.4](https://github.com/faisalkhan91/Fluxus/compare/v1.2.3...v1.2.4) (2026-04-04)

### Bug Fixes

- force release pipeline to trigger ([814a3a8](https://github.com/faisalkhan91/Fluxus/commit/814a3a80e48dde63b7e7e9586ab64d5db1680503))

### Changed

- Synchronized production build and deployment pipeline state via changelog alignment
- Rewrote `nginx.conf` with SSG-aware routing, gzip, granular cache policies, custom 404, `server_tokens off`
- Cache strategy: immutable 1-year for hashed JS/CSS/fonts; 1-year for images; `no-cache` for HTML/manifest/sitemap
- Disabled font inlining (`optimization.fonts: false`) to eliminate build-time Google Fonts dependency
- Updated Angular to 21.2.7, RxJS to 7.8.2, Express to 5.2.1
- Rewrote `README.md` and `CHANGELOG.md` to follow 2026 best practices

### Added

- Multi-stage Dockerfile with `node:24-alpine` builder and `nginxinc/nginx-unprivileged:1.27-alpine` runtime
- BuildKit optimizations: `--mount=type=cache` for npm, `COPY --link` for layer independence
- OCI image labels (`org.opencontainers.image.*`)
- `.dockerignore` excluding build artifacts and metadata
- Adaptive SVG favicon with dark/light mode via `prefers-color-scheme`
- Multi-size `favicon.ico` (16/32/48), `apple-touch-icon.png`, PWA manifest icons (192/512)

### Fixed

- Resolved `NotYetImplemented` error in `IconComponent` during SSG prerendering
- Custom 404 returns HTTP 404 via `index.csr.html` copied as `404.html`

### Security

- Added CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy in NGINX

## [1.2.3](https://github.com/faisalkhan91/Fluxus/compare/v1.2.2...v1.2.3) (2026-04-04)

### Bug Fixes

- **security:** ignore known base image vulnerabilities in Trivy scan ([26f705e](https://github.com/faisalkhan91/Fluxus/commit/26f705ee7021c7e0a16191b45d9707fb04867765))

## [1.2.2](https://github.com/faisalkhan91/Fluxus/compare/v1.2.1...v1.2.2) (2026-04-04)

### Bug Fixes

- **core:** bootstrap application and core runtime initialization logic ([9e3e0a3](https://github.com/faisalkhan91/Fluxus/commit/9e3e0a3b37dbcb25094699323a54f462493b88b0))

## [1.2.1](https://github.com/faisalkhan91/Fluxus/compare/v1.2.0...v1.2.1) (2026-04-03)

### Bug Fixes

- remove obsolete CI error fix patch and update Karma configuration ([93bebe2](https://github.com/faisalkhan91/Fluxus/commit/93bebe2e51d855ef2cde94978531c3c009e5558a))
- resolve CI lint errors and setup-node deprecation ([bdf4418](https://github.com/faisalkhan91/Fluxus/commit/bdf441858ea36cd8055cf36e705952dba656a2f1))

## [1.2.0](https://github.com/faisalkhan91/Fluxus/compare/v1.1.0...v1.2.0) (2026-04-03)

### Features

- Add adjacent post navigation and reading progress indicator to blog post component ([01ae611](https://github.com/faisalkhan91/Fluxus/commit/01ae611a554eb24861c3b12c3ea2e85300e084d4))
- Add adjacent post navigation and reading progress indicator to blog post component ([4e8c342](https://github.com/faisalkhan91/Fluxus/commit/4e8c342dfdad2404ad99d2930d346c5b017de3bc))
- Add blog feature with routing and styling enhancements ([55e33a6](https://github.com/faisalkhan91/Fluxus/commit/55e33a696f404f579803b495129715c0555b50c7))
- Add custom Nginx configuration for SPA routing in Dockerfile ([503094d](https://github.com/faisalkhan91/Fluxus/commit/503094d50c23fa1505374fd0895f73d7eaf46e22))
- Add new blog post on Angular Signals state management ([00c07ad](https://github.com/faisalkhan91/Fluxus/commit/00c07ad18560a42a86faf04d26411f10ea88c86d))
- Enhance Angular configuration and improve server-side rendering support ([ca045b8](https://github.com/faisalkhan91/Fluxus/commit/ca045b8d2f1473c8ab8075bdeace788c7fcb21e3))
- Enhance navigation and tab functionality with new home link and close tab logic ([f369a69](https://github.com/faisalkhan91/Fluxus/commit/f369a699907e467b2786535326854093144b48f6))
- Enhance SEO and accessibility features across the application ([561b70c](https://github.com/faisalkhan91/Fluxus/commit/561b70c7a5a84cdee38fb38ce565e5a197c81f23))
- Enhance SEO and styling across the application ([d9e9c96](https://github.com/faisalkhan91/Fluxus/commit/d9e9c96660838c15d4667cc1912d685d2943af8c))
- Enhance SEO and styling across the application ([02cc35b](https://github.com/faisalkhan91/Fluxus/commit/02cc35bab5374b0dfffa5247efae82739e5a1d48))
- Enhance styling and functionality across various components ([a3b965d](https://github.com/faisalkhan91/Fluxus/commit/a3b965dfe6b5eb635664bb68c87bdc3f2767d1cc))
- Improve icon component to handle server-side rendering ([489c8e0](https://github.com/faisalkhan91/Fluxus/commit/489c8e0a836924c74d0f55c33781715819f39318))
- Improve user profile and SEO details for enhanced visibility ([7e23b2a](https://github.com/faisalkhan91/Fluxus/commit/7e23b2a549de5c49135aefeab47dbdd80f926168))
- Optimize Angular build and enhance NGINX configuration ([165ba6a](https://github.com/faisalkhan91/Fluxus/commit/165ba6ac74f432a1c3ea7d8f3efb88847f21761b))
- Update profile and SEO details to reflect senior role and experience ([8d38c25](https://github.com/faisalkhan91/Fluxus/commit/8d38c2596939ec4c04b5b836d9c25b020d2fcaa9))

### Bug Fixes

- Remove unnecessary peer dependencies from package-lock.json ([60ad0b6](https://github.com/faisalkhan91/Fluxus/commit/60ad0b6e9a661b0e440016099c820d820fbac699))
- resolve SSR NotYetImplemented error in IconComponent ([44eef70](https://github.com/faisalkhan91/Fluxus/commit/44eef70e1210d746408f76e0aeb66e315320576e))

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

[Unreleased]: https://github.com/faisalkhan91/Fluxus/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/faisalkhan91/Fluxus/compare/v1.2.4...v1.3.0
[1.2.0]: https://github.com/faisalkhan91/Fluxus/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/faisalkhan91/Fluxus/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/faisalkhan91/Fluxus/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/faisalkhan91/Fluxus/compare/v0.0.0...v1.0.0
[0.0.0]: https://github.com/faisalkhan91/Fluxus/releases/tag/v0.0.0
