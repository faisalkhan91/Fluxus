# Fluxus

![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular)
![License](https://img.shields.io/badge/License-MIT-blue)
![Docker](https://img.shields.io/badge/Docker-nginx--unprivileged-2496ED?logo=docker)
![Deploy](https://img.shields.io/badge/Deploy-Kubernetes-326CE5?logo=kubernetes)

A personal portfolio site built with Angular 21, styled as a code-editor workspace. The entire application is statically generated (SSG) and served from a hardened NGINX container on Kubernetes.

**Live:** [faisalkhan.dpdns.org](https://faisalkhan.dpdns.org)

![FluxusOverview](https://github.com/faisalkhan91/Fluxus/assets/25315418/ea068c29-3c10-4cdc-873e-ec6224bb7478)

---

## Tech Stack

| Layer      | Technology                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Framework  | Angular 21.2.7 (standalone components, signals, `OnPush`)                                        |
| Rendering  | SSG via `@angular/ssr` — 12 static routes prerendered at build time                              |
| Styling    | Scoped component CSS + global design tokens (`src/styles.css`)                                   |
| Blog       | Markdown files rendered via `marked` + `highlight.js`                                            |
| Container  | Multi-stage Docker — `node:24-alpine` builder, `nginxinc/nginx-unprivileged:1.27-alpine` runtime |
| Web Server | NGINX with gzip, granular cache policies, and full security headers                              |
| Language   | TypeScript 5.5 (strict mode, no `any`)                                                           |

## Features

- **Glass Workspace UI** — Glassmorphism design system with `backdrop-filter`, custom design tokens, dark/light mode
- **Static Site Generation** — All routes prerendered at build time for instant load and SEO
- **Blog Engine** — Markdown posts with syntax highlighting, reading progress bar, prev/next navigation
- **Adaptive Favicon** — SVG favicon with dark/light mode support, multi-size ICO, apple-touch-icon, PWA manifest icons
- **Full SEO** — Per-route `<title>`, `og:*`, `twitter:*` meta tags, canonical URLs, `sitemap.xml`, `robots.txt`
- **Accessibility** — Skip-to-content link, WCAG AA focus styles, ARIA attributes on all interactive elements
- **Security Headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

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

### Production (SSG + blog meta injection)

```bash
npm run build:prod
```

This runs `ng build --configuration production` followed by `node scripts/inject-blog-meta.mjs`, which replaces default OG/Twitter/title tags in each prerendered blog HTML with post-specific values.

Build output goes to `dist/fluxus/browser/` — 12 prerendered static routes as directories with `index.html` inside each.

## Docker

### Build the image

```bash
docker build -t fluxus .
```

### Run locally

```bash
docker run --rm -p 8080:8080 fluxus
```

Open `http://localhost:8080/hero/` in your browser.

The container runs as non-root (UID 101) on port 8080, ready for Kubernetes deployment with `readOnlyRootFilesystem: true` and all capabilities dropped.

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
| `/`               | Redirect to `/hero`     | —                          |
| `/hero`           | HeroComponent           | Prerendered                |
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

The post-build script `scripts/inject-blog-meta.mjs` injects post-specific OG/Twitter meta into each prerendered blog HTML.

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
