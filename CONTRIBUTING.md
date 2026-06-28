# Contributing to Fluxus

Fluxus is a personal portfolio + blog, but the project is public and PRs / issues
are welcome. This guide captures the conventions the codebase already enforces so
a change lands green on the first try.

## Setup

```bash
nvm use            # Node 24 (see .nvmrc / engines.node ">=24.15.0 <25")
npm ci
npm start          # ng serve on http://localhost:4200
```

## Before you open a PR

Run the same gates CI runs:

```bash
npm run lint          # ng lint + prettier --check
npm run typecheck     # tsc --noEmit
npm run test:coverage # Vitest unit suite (coverage floors enforced)
npm run build:prod    # full 13-step SSG build incl. CSP + prerender + structured-data audits
npm run e2e           # Playwright (a11y across 10 themes, CSP, INP, focus-trap, …)
```

For any change that affects rendered output (CSS, templates, themes, images), also run the
visual-regression suite and confirm zero diffs:

```bash
npm run build:prod && npm run e2e:visual        # 0 diffs expected
npm run e2e:visual:update                        # only after an *intended* visual change
```

## Conventions (enforced by lint / review)

- **Angular 22, standalone-only, zoneless + signals.** No NgModules; no `standalone: true` in
  decorators (it's the default). Use `input()` / `output()` / `computed()`, `inject()`, native
  control flow (`@if` / `@for` / `@switch`), and `@Service()` for root singletons.
- **No `ngClass` / `ngStyle`** — use `class` / `style` bindings. **No `any`** — `unknown` + guards.
- **TS, CSS and HTML live in separate files.** `NgOptimizedImage` for static images.
- **WCAG AA is non-negotiable** (axe + the computed per-theme contrast contract).
- **Generated files** (`*.generated.{ts,json}`, `dist/fluxus/security-headers.conf`) are produced by
  the `scripts/` pipeline — never hand-edit; re-run the relevant `npm run build:*` script.
- AI-assistant guidance lives in `instructions.md` / `.ai/` / `.cursor/` / `.gemini/`.

## Commits

Conventional Commits. The types surfaced in the changelog are `feat:`, `fix:`, `perf:`,
`refactor:`, `docs:`, and `chore:` (see `release-please-config.json`); `test:` / `build:` / `ci:`
are also accepted but are not surfaced in the changelog. Releases + the changelog are automated by
release-please, so the commit type drives the version bump — keep the subject accurate.

## Content (blog / projects)

- Blog posts: Markdown in `src/assets/blog/posts/<slug>.md` + a metadata entry in
  `src/assets/blog/posts.json` (copy `blog-post-template.md`). Reading time/word count are synced by
  `npm run sync:reading-times`. `draft: true` and future `date`s are hidden from listings/sitemap/feed
  and marked `noindex` while still prerendered for review.
- Projects are GitHub-discovered (`npm run fetch:projects`) + `projects.overrides.json`.
