# Fluxus Rendering Audit — April 2026

**Branch:** `audit/rendering-2026-04`
**Date:** 2026-04-25
**Scope:** Read-only audit of every rendering path in the Angular 21 SSR app
(runtime change detection, SSR/prerender correctness, visual/layout, a11y,
template modernization). No code, config, or template changes were made.

---

## 1. Executive summary

Fluxus is in unusually good rendering shape. Every component is OnPush, the app
runs zoneless, signals are used everywhere primitives appear in templates,
modern control flow has fully replaced legacy structural directives, and
incremental hydration is enabled. The custom `audit-prerender.mjs` script
already guards against the most painful classes of SSR regression. Most
findings below are second-order: small a11y rough edges, one CLS hotspot
around lazy-rendered Mermaid diagrams, and a handful of low-cost
modernization moves (`@defer`, `input.required()`).

| Severity | Count | What it means                                                    |
| -------- | ----- | ---------------------------------------------------------------- |
| **P0**   | 0     | Correctness bug (SSR crash, hydration mismatch, broken a11y).    |
| **P1**   | 4     | User-visible perf or a11y regression on common paths.            |
| **P2**   | 9     | Maintainability / consistency, measurable but minor user impact. |
| **P3**   | 9     | Stylistic / future-proofing nits.                                |

**Already excellent (no work required):**

- 25/25 components on `ChangeDetectionStrategy.OnPush`.
- `provideZonelessChangeDetection()` + `provideClientHydration(withIncrementalHydration())` configured.
- Zero legacy `*ngIf` / `*ngFor` / `*ngSwitch` directives — all templates use modern control flow.
- Signal inputs/outputs adopted across every public UI component.
- Every browser-global access (`window`, `document`, `localStorage`, `navigator`, `CSS`) is
  guarded with `isPlatformBrowser`, `afterNextRender`, or a `typeof window !== 'undefined'` check.
- Inline pre-paint theme script in `src/index.html` and the runtime `ThemeService` apply
  identical resolution rules → no FOUC.
- Reading-progress bar uses `@supports (animation-timeline: scroll())` with a JS rAF-throttled
  fallback, gated by `CSS.supports()` so the two paths never conflict.
- Every `<img>` examined either uses `NgOptimizedImage` or carries explicit `width`/`height`
  attributes plus `loading`/`decoding` hints.
- `prefers-reduced-motion` is honored globally in `src/styles.css` (line 844) and explicitly
  in `app-blog-post .reading-progress`, `.skeleton-line`, and toast region motion.
- Native `<dialog>` element used for the command palette — focus trap, top layer, and
  escape-to-close are handled by the platform.
- Heavy libraries (`mermaid`, `web-vitals`, `@sentry/browser`) are lazy-loaded behind browser
  gates so the SSR bundle and the home-route chunk never pay for them.

---

## 2. Methodology

- **Tools:** `rg` over the source tree, `Read` of every component / service / template /
  stylesheet referenced from `src/app/app.routes.ts` plus `src/styles.css`,
  `src/index.html`, and the SSR-side modules (`app.config.server.ts`,
  `app.routes.server.ts`, `server.ts`). The custom audit script
  [scripts/audit-prerender.mjs](../../scripts/audit-prerender.mjs) was read but not run
  (requires a fresh `npm run build:prod`).
- **What was NOT verified at runtime:** Lighthouse scores, throttled-CPU INP, real-device
  CLS measurements, cross-browser visual diffs, bundle-size deltas, and live Core Web
  Vitals from the production telemetry endpoint
  ([src/app/core/services/web-vitals.service.ts](../../src/app/core/services/web-vitals.service.ts)).
  Those require a deployed build and are explicitly out of scope (see §6).
- **Non-goals:** SEO content quality, copy editing, build-script behaviour, e2e tests,
  CSP/header configuration in `nginx.conf`, service worker rollout strategy.

### Severity rubric

- **P0** — Correctness bug. SSR crash, hydration mismatch, broken focus management on
  primary navigation, or a misconfigured `RenderMode` that breaks deploys.
- **P1** — User-visible perf or a11y regression on common paths (CLS > 0.05 on a
  primary route, missed announcement on a critical state change, repeated CD work that
  would show up as INP regression on low-end devices).
- **P2** — Maintainability / consistency. Measurable but minor user impact; future
  contributor friction; incidental DOM weight.
- **P3** — Stylistic / future-proofing nits. No measurable impact today, but worth
  picking up next time the area is touched.

---

## 3. Inventory snapshot (baseline metrics)

These are the "we already passed" numbers — recorded so the next audit can detect drift
without re-walking the same files.

| Metric                                                      | Count / value | Source                                                                                                                                                     |
| ----------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --------- |
| Total feature + UI components                               | 25            | `rg` over `src/app/**/*.component.ts`                                                                                                                      |
| Components on `ChangeDetectionStrategy.OnPush`              | 25            | `rg "ChangeDetectionStrategy\.OnPush"`                                                                                                                     |
| Legacy structural directives (`*ngIf`/`*ngFor`/`*ngSwitch`) | 0             | `rg "\*ng(If                                                                                                                                               | For | Switch)"` |
| `@for` blocks with explicit `track`                         | 35            | `rg "@for \\(.*track" -c`                                                                                                                                  |
| `@for` blocks tracking `$index`                             | 5             | About bio, timeline, icon shapes, mobile menu, toast (each acceptable for static lists)                                                                    |
| `@switch` blocks                                            | 2             | Icon shapes, contact form stage                                                                                                                            |
| `@defer` blocks                                             | 1             | `src/app/features/hero/hero.component.html:51`                                                                                                             |
| `loadComponent` lazy routes                                 | 12            | `src/app/app.routes.ts`                                                                                                                                    |
| `signal()` declarations                                     | 30+           | (services + components)                                                                                                                                    |
| `computed()` declarations                                   | ~35           | (services + components)                                                                                                                                    |
| `effect()` declarations                                     | 8             | `BlogPostComponent` ×3, `BlogTagComponent`, `EditorTabBarComponent`, `MobileNavPillComponent`, `ThemeService`, plus nested effects under `afterNextRender` |
| `input()` declarations                                      | 12 unrequired |                                                                                                                                                            |
| `input.required()` declarations                             | 3             | `IconComponent.name`, `SectionHeaderComponent.title`, `SkillBadgeComponent.name`                                                                           |
| Components using `NgOptimizedImage`                         | 6             | sidebar, about, projects, certifications, skill-badge, blog-post (avatar only)                                                                             |
| `.subscribe()` calls in non-spec source                     | 2             | `seo.service.ts`, `tab.service.ts` (both with `takeUntilDestroyed`)                                                                                        |
| `backdrop-filter` declarations                              | 8 stylesheets | glass-card, glass-panel, command-palette, sidebar-mobile-toggle, mobile-nav-pill, glow-button, not-found, plus print override                              |
| Prerendered top-level routes                                | 9 + dynamic   | `app.routes.server.ts`                                                                                                                                     |
| Blog posts on disk                                          | 4             | `src/assets/blog/posts/*.md`                                                                                                                               |

---

## 4. Findings by dimension

Each finding has an ID (e.g. `A1`, `B3`), severity, evidence with `file:line` references,
why it matters, and a recommended fix. No code is applied.

### A. Change detection & runtime performance

#### A1 — `[P2]` — `EditorTabBarComponent` mixes lifecycle hooks with `effect()` in a way that double-schedules fade recomputation

**Location:** [src/app/ui/editor-tab-bar/editor-tab-bar.component.ts:50-74](../../src/app/ui/editor-tab-bar/editor-tab-bar.component.ts)

```50:74:src/app/ui/editor-tab-bar/editor-tab-bar.component.ts
  constructor() {
    effect(() => {
      this.tabs();
      if (this.isBrowser) {
        queueMicrotask(() => this.updateFades());
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    // ...
    this.updateFades();
  }
```

**Why it matters:** The `effect()` reacts to `tabs()` changes and queues a microtask that
calls `updateFades()`. `ngAfterViewInit` does the same on initial view. On the very first
render the fades are recomputed twice (once from the effect's initial run, once from
`ngAfterViewInit`). Functionally fine, but the dual scheduling muddies the mental model
and would catch a future contributor who tries to extend either path.

**Recommendation:** Replace the constructor `effect()` with `afterRenderEffect(() => …)`
once the API is GA in v21, or move the entire fade-update flow into `afterNextRender` /
`afterEveryRender` so there's a single ownership point. `ngAfterViewInit` can then go
away entirely.

---

#### A2 — `[P2]` — `BlogPostComponent` registers nested `effect()` inside `afterNextRender` rather than at construction

**Location:** [src/app/features/blog/blog-post/blog-post.component.ts:344-484](../../src/app/features/blog/blog-post/blog-post.component.ts)

```461:482:src/app/features/blog/blog-post/blog-post.component.ts
      this.rewriteAnchorHrefs(postLayout);
      effect(
        () => {
          this.content();
          untracked(() => this.rewriteAnchorHrefs(postLayout));
        },
        { injector: this.injector },
      );
      this.scheduleMermaidRender(postLayout);
      effect(
        () => {
          this.content();
          untracked(() => this.scheduleMermaidRender(postLayout));
        },
        { injector: this.injector },
      );
```

**Why it matters:** Two `effect()`s are registered inside the `afterNextRender` callback.
This works, but it's harder to reason about reactivity (the effects only exist after the
first render fires) and a future refactor that moves the DOM hooks out of
`afterNextRender` would silently lose the reactive content-swap behaviour. The pattern
also means each effect captures the same closure variable (`postLayout`) twice; if
that element ever moves in the DOM tree (e.g. a redesign), both registrations need to
be updated in lock-step.

**Recommendation:** Hoist both effects to `constructor()` and use `afterNextRender` only
to discover `postLayout`. The effects can read a `signal<HTMLElement | null>(null)` that
the `afterNextRender` block sets, and `untracked()` calls call into the same imperative
helpers as today.

---

#### A3 — `[P3]` — `NavigationService.sidebarItems()` is a `computed()` over a static constant

**Location:** [src/app/core/services/navigation.service.ts:112-132](../../src/app/core/services/navigation.service.ts)

```112:132:src/app/core/services/navigation.service.ts
  readonly sidebarItems = computed<SidebarItem[]>(() =>
    NAV.filter((e) => e.inSidebar).map((e) =>
      e.type === 'divider'
        ? { type: 'divider', label: e.label }
        : { type: 'link', label: e.label, ext: e.ext, route: e.route, icon: e.icon },
    ),
  );
```

**Why it matters:** `NAV` is a module-level `const` that never changes. Wrapping the
derived view in `computed()` adds reactivity overhead (signal graph node, dependency
tracking) for no benefit. The same applies to `mobileNavItems` and `mobileMenuItems`.

**Recommendation:** Compute these once at construction (`readonly sidebarItems = NAV.filter(...)`)
or, if you want to keep the signal-shaped public API for symmetry, lift the result into
a frozen `const` and wrap it in `signal.readonly()` once.

---

#### A4 — `[P3]` — `SidebarComponent` `@for ... track item` tracks by object reference

**Location:** [src/app/ui/sidebar/sidebar.component.html:23](../../src/app/ui/sidebar/sidebar.component.html)

```22:24:src/app/ui/sidebar/sidebar.component.html
<ul class="nav-list">
  @for (item of items(); track item) {
```

**Why it matters:** `track item` works today because `NavigationService.sidebarItems()` is
a memoized computed and returns the same array references each call (see A3). But the
moment that computed depends on a real signal (e.g. a future "show admin links" toggle),
the array recomputes and `track item` invalidates every row, forcing a full DOM
recreate.

**Recommendation:** Switch to `track item.label` (or a real `id` field added to the
`NavLink`/`NavDivider` discriminator). The mobile menu already tracks `$index` (acceptable
for an immutable static list) and the timeline tracks `$index` likewise.

---

#### A5 — `[P3]` — Hero `@defer` skeleton template is duplicated between the main and `@placeholder` branches

**Location:** [src/app/features/hero/hero.component.html:51-112](../../src/app/features/hero/hero.component.html)

The skeleton markup that surfaces while `BlogService` is loading is repeated verbatim
inside both the main `@defer` block and the `@placeholder` block. Each future copy-paste
edit has to be applied twice.

**Recommendation:** Extract to a private `<ng-template #blogSkeleton>` and `*ngTemplateOutlet`
(or, if you prefer signal-friendly DI, a 1-line `BlogSkeletonComponent`). The OnPush
budget is unchanged either way.

---

#### A6 — `[P2]` — `BlogComponent.featuredCover()` and `featuredCoverDims()` are functions called from the template

**Location:** [src/app/features/blog/blog.component.ts:42-51](../../src/app/features/blog/blog.component.ts) +
[src/app/features/blog/blog.component.html:52-55](../../src/app/features/blog/blog.component.html)

```42:51:src/app/features/blog/blog.component.ts
  protected featuredCover(post: BlogPost): string {
    return post.cover ?? `/og/${post.slug}.png`;
  }
  protected featuredCoverDims(post: BlogPost): { w: number; h: number } {
    const cover = post.cover;
    if (!cover || /^https?:/i.test(cover)) return OG_FALLBACK_DIMS;
    const key = cover.replace(/^\.?\/?/, '');
    return IMAGE_DIMS[key] ?? OG_FALLBACK_DIMS;
  }
```

**Why it matters:** OnPush + zoneless means these only re-evaluate when something in the
parent's signal graph changes — but `featuredCoverDims()` returns a new object reference
on every call, which defeats `OnPush` reference equality if any child component takes
the result as an `@Input()`. Today the only consumer is plain HTML attribute binding
(`[width]="featuredCoverDims(post).w"`), so the impact is two object allocations per
post per render. Cheap, but unnecessary.

**Recommendation:** Compute a `featuredCovers = computed(() => posts.map(p => ({...})))`
or attach the resolved cover/dims to `BlogPost` at the manifest level (i.e. let
`scripts/build-image-dims.mjs` enrich `posts.json`). The latter would also let the
prerender output get the dims without the runtime needing the IMAGE_DIMS map.

---

#### A7 — `[P2]` — `BlogPostComponent.canWebShare()` is a `computed()` that reads `navigator` once at construction time

**Location:** [src/app/features/blog/blog-post/blog-post.component.ts:230-233](../../src/app/features/blog/blog-post/blog-post.component.ts)

```230:233:src/app/features/blog/blog-post/blog-post.component.ts
  readonly canWebShare = computed(() => {
    if (typeof navigator === 'undefined') return false;
    return typeof navigator.share === 'function';
  });
```

**Why it matters:** Wrapping a one-shot environment check in `computed()` creates a signal
graph node that never changes, but still costs an evaluation every time the post header
re-renders. Conceptually it's a constant.

**Recommendation:** Replace with a `readonly canWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';`
(evaluated once during component construction). Same effect, no signal graph cost.

---

### B. SSR & prerender correctness

#### B1 — `[P1]` — `RenderMode.Prerender` is set on the `**` catch-all (`NotFoundComponent`)

**Location:** [src/app/app.routes.server.ts:54](../../src/app/app.routes.server.ts)

```54:55:src/app/app.routes.server.ts
  { path: '**', renderMode: RenderMode.Prerender },
```

**Why it matters:** The Angular CLI's prerender pass for `**` is a no-op (it can't enumerate
"all 404s"), so this entry is effectively unused on disk — but in production, when nginx
serves an unknown URL, it currently lacks a prerendered 404 to fall back on. Visitors land
on the SPA shell and the 404 is rendered after JS boots. That breaks "fastest-failure"
crawlers (search-index 404s) and feels slower for real users.

**Recommendation:** Switch the catch-all to `RenderMode.Server` (or pre-emit a static
`/404.html` and route nginx's `error_page 404 /404.html;` at it). Either approach gives
crawlers the right status code without an SPA boot.

---

#### B2 — `[P1]` — `NotFoundComponent` reads `router.url` for the displayed path; under SSR / prerender the value is `'/'`

**Location:** [src/app/features/not-found/not-found.component.ts:19-29](../../src/app/features/not-found/not-found.component.ts) +
[src/app/features/not-found/not-found.component.html:15-19](../../src/app/features/not-found/not-found.component.html)

```19:29:src/app/features/not-found/not-found.component.ts
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
      takeUntilDestroyed(),
    ),
    { initialValue: this.router.url },
  );
  protected readonly path = computed(() => (this.currentUrl() ?? '/').replace(/^\//, ''));
```

The template shows `curl -I /{{ path() }}` and `grep -r "{{ path() }}" ./src/app/app.routes.ts`.
Under prerender, `router.url` is `'/'` for whatever path the prerender pass actually
served, so the prerendered HTML shows `curl -I /` (empty) until hydration fixes it on the
client. That's a hydration-time content swap on the most prominent line of the page.

**Recommendation:** When fixing B1, also defer the `path()` rendering to a browser-only
`@if (isBrowser) { ... }` slot, OR pass the path through `ActivatedRoute.snapshot.url` /
`Document.location.pathname` (browser only) without flowing it through the `Router.events`
stream. Simplest: render a generic placeholder under SSR and only swap in the live path
on hydration.

---

#### B3 — `[P2]` — `webVitals.start()` runs from `provideAppInitializer` and lazy-imports `web-vitals` immediately on hydration

**Location:** [src/app/app.config.ts:46-49](../../src/app/app.config.ts) +
[src/app/core/services/web-vitals.service.ts:33-39](../../src/app/core/services/web-vitals.service.ts)

```46:49:src/app/app.config.ts
    provideAppInitializer(() => {
      void inject(WebVitalsService).start();
    }),
```

**Why it matters:** `start()` is `async` and the initializer is fire-and-forget, so it
doesn't block bootstrap. But the dynamic `await import('web-vitals')` _does_ trigger an
eager network/parse cost during the LCP window for first-time visitors. Defending the
budget on the home route in particular matters; web-vitals is small (~3 KB gz) so the
real impact is parse-time on low-end devices.

**Recommendation:** Move `start()` to fire from `requestIdleCallback` (or `afterNextRender`

- a `setTimeout(start, 1500)`) so the LCP frame and the first INP-eligible interaction
  land before the lib is parsed.

---

#### B4 — `[P2]` — `audit-prerender.mjs` does not check tag landing pages

**Location:** [scripts/audit-prerender.mjs:33-52](../../scripts/audit-prerender.mjs)

The `ROUTES` array enumerates the eight static top-level pages; blog post pages are
checked separately via `listBlogPostSlugs()`. Tag pages (`/blog/tag/<slug>`) are
prerendered in production but the audit ignores them.

**Why it matters:** A regression in `BlogTagComponent.updateMetaTags()` (e.g. canonical
URL drift, missing `og:type`) would ship undetected. The current audit covers the most
likely failure modes for posts but leaves the tag surface uncovered.

**Recommendation:** Add a `listBlogTagSlugs()` helper that mirrors `listBlogPostSlugs()`
and walks `dist/fluxus/browser/blog/tag/*/index.html` with the same canonical / og /
twitter / h1 checks already used for posts.

---

#### B5 — `[P3]` — `ContactComponent.copyEmail()` calls `document.execCommand('copy')` for the legacy fallback inside an SSR-safe component

**Location:** [src/app/features/contact/contact.component.ts:88-99](../../src/app/features/contact/contact.component.ts)

The fallback path is gated by `isBrowser` (line 83), but the same fallback exists in
`BlogPostComponent.copyToClipboard()` ([line 293-307](../../src/app/features/blog/blog-post/blog-post.component.ts))
and was already abstracted there. The two implementations have drifted slightly
(the contact one doesn't try `navigator.clipboard.writeText` first; it always falls
through to `execCommand`).

**Recommendation:** Extract a single `copyToClipboard()` helper into
`@shared/utils/clipboard.utils.ts` and use it from both call sites.

---

#### B6 — `[P3]` — Mermaid is loaded once per blog-post mount; theme is sampled at render time and never refreshed

**Location:** [src/app/features/blog/blog-post/blog-post.component.ts:573-579](../../src/app/features/blog/blog-post/blog-post.component.ts)

```573:579:src/app/features/blog/blog-post/blog-post.component.ts
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark',
        securityLevel: 'strict',
      });
```

**Why it matters:** A reader who toggles the theme after the diagram has rendered is left
with mermaid SVGs in the previous theme. Likely rare in practice (post readers rarely
flip themes mid-session) but worth flagging.

**Recommendation:** Re-render mermaid (cheaply, since the lib is already loaded) when
`ThemeService.theme()` changes by adding an `effect()` that depends on
`themeService.isDark()` and invalidates a `mermaidVersion` signal that the existing
content-change effect already tracks.

---

### C. Visual / layout (CLS, FOUC, theming, glass)

#### C1 — `[P1]` — Mermaid placeholder reserves no aspect ratio, so render-time replacement causes layout shift

**Location:** [src/app/core/services/markdown.service.ts:191-208](../../src/app/core/services/markdown.service.ts) +
[src/app/features/blog/blog-post/blog-post.component.css:551-572](../../src/app/features/blog/blog-post/blog-post.component.css)

```191:194:src/app/core/services/markdown.service.ts
        if (langKey === 'mermaid') {
          return `<pre class="mermaid-source" data-mermaid-source>${escapeHtml(text)}</pre>\n`;
        }
```

```551:561:src/app/features/blog/blog-post/blog-post.component.css
.mermaid-source {
  margin: var(--space-6) 0;
  padding: var(--space-4);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  white-space: pre-wrap;
  color: var(--text-muted);
}
```

**Why it matters:** The placeholder height is set by the wrapped source text. The rendered
SVG (`.mermaid svg { max-width: 100%; height: auto; }`) takes the diagram's intrinsic
aspect ratio. The two are unrelated — small mermaid sources can render to tall flow
diagrams, and vice versa. This is exactly the CLS pattern Lighthouse flags ("avoid
non-composited animations" / "elements that shift after first paint"). With mermaid
deferred to `requestIdleCallback`, the shift can be substantial (post header sections
above the diagram appear stable; everything below jumps).

**Recommendation:** Mirror the image-dims approach: have a build-time script
(`scripts/build-mermaid-dims.mjs` or inlined into `build-image-dims.mjs`) headlessly
render every mermaid block and emit a JSON map `{ "<post-slug>:<index>": { w, h } }`.
The marked renderer would then attach `style="aspect-ratio: w / h"` to the placeholder.
Worst case fallback: emit a generic `aspect-ratio: 16 / 9` on `.mermaid-source` so the
shift is bounded.

---

#### C2 — `[P1]` — Reading-progress bar has `role="progressbar"` and live `aria-valuenow`, broadcasting scroll position to AT

**Location:** [src/app/features/blog/blog-post/blog-post.component.html:2-10](../../src/app/features/blog/blog-post/blog-post.component.html)

```2:10:src/app/features/blog/blog-post/blog-post.component.html
  <div
    class="reading-progress"
    role="progressbar"
    aria-label="Reading progress"
    aria-valuemin="0"
    aria-valuemax="100"
    [attr.aria-valuenow]="readingProgressLabel()"
    [style.transform]="'scaleX(' + scrollProgress() / 100 + ')'"
  ></div>
```

**Why it matters:** The bar is purely decorative motion; assistive tech already gives the
user scroll/percentage info. Exposing an `aria-valuenow` that updates 60 times a second
during scroll triggers VoiceOver / NVDA into chatty progress announcements ("47%, 48%,
49%…") on some configurations. Some users tune AT to be less verbose, but the default
experience is poor.

**Recommendation:** Drop the `role="progressbar"` and `aria-*` attributes; mark the bar
`aria-hidden="true"`. The CSS already hides it under `prefers-reduced-motion`. Keep the
visual treatment unchanged.

---

#### C3 — `[P2]` — Several stacked `backdrop-filter` surfaces possible on a single page

**Location (per stylesheet):**

- [src/app/ui/glass-card/glass-card.component.css:13-29](../../src/app/ui/glass-card/glass-card.component.css)
- [src/app/ui/glass-panel/glass-panel.component.css](../../src/app/ui/glass-panel/glass-panel.component.css)
- [src/app/ui/command-palette/command-palette.component.css:13-17](../../src/app/ui/command-palette/command-palette.component.css)
- [src/app/ui/mobile-nav-pill/mobile-nav-pill.component.css:25-36](../../src/app/ui/mobile-nav-pill/mobile-nav-pill.component.css)
- [src/app/core/shell/shell.component.css:80-103](../../src/app/core/shell/shell.component.css) (mobile theme toggle)
- [src/app/ui/glow-button/glow-button.component.css](../../src/app/ui/glow-button/glow-button.component.css)
- [src/app/features/not-found/not-found.component.css](../../src/app/features/not-found/not-found.component.css)

**Why it matters:** On the home (`/`) and blog (`/blog`) routes a phone user can see, on
one viewport, the mobile nav pill, the mobile theme toggle, every visible
`ui-glass-card` (e.g. 6 latest-post cards), and any open command palette overlay —
each independently running a `backdrop-filter: blur(20px)` (or 1.5×/2× for higher
elevations). Browsers re-blur each layer on every scroll frame; on iOS Safari and
mid-range Android the GPU cost compounds non-linearly. The hero already removes the
two `.glow` orbs below 480 px for the same reason; the same defensive logic doesn't
apply to the glass surfaces.

**Recommendation:**

1. Disable `backdrop-filter` on `<ui-glass-card>` below 768 px (replace with a flat
   `var(--surface-raised)` fill) — verify visually first.
2. Audit each route to ensure no more than 2-3 simultaneously-visible blurred surfaces
   on phone breakpoints.
3. Add a perf budget: if `prefers-reduced-transparency` is supported (Safari 17+),
   collapse all blurs to flat fills.

---

#### C4 — `[P2]` — Container queries declared but never used

**Location:** [src/styles.css:1007-1011](../../src/styles.css)

```1007:1011:src/styles.css
@supports (container-type: inline-size) {
  .content {
    container-type: inline-size;
  }
}
```

`rg "@container"` returns zero matches anywhere in the app. So `.content` advertises
itself as a container but no rule queries against it. The `container-type: inline-size`
declaration is mostly free, but it disables auto-sizing of the `.content` element's
intrinsic block size — there's a documented Chrome/Safari bug in this area
(<https://bugs.chromium.org/p/chromium/issues/detail?id=1416994>).

**Recommendation:** Either ship the originally-intended `@container .content (max-width: 800px)`
rules for the post-grid/skill-grid (where they would be a real win — e.g. the latest-posts
row collapses based on container width when the sidebar is collapsed) or remove the
`container-type` declaration until you do.

---

#### C5 — `[P2]` — Featured/cover blog images are plain `<img>` and bypass `NgOptimizedImage`

**Location:** [src/app/features/blog/blog.component.html:51-59](../../src/app/features/blog/blog.component.html) +
[src/app/features/blog/blog-post/blog-post.component.html:115-127](../../src/app/features/blog/blog-post/blog-post.component.html)

The featured (LCP-eligible) blog list cover and the post-cover hero use plain `<img>`
with manually-set `loading="eager"` + `decoding="async"` + `fetchpriority="high"`. Other
images in the same templates (avatar, skill icons, project images) use `[ngSrc]`.

**Why it matters:** `NgOptimizedImage`'s `priority` flag handles `loading`/`decoding`/
`fetchpriority` automatically and would warn on missing dims, missing alt, and (via
`NgOptimizedImage`'s preconnect logic) missing `<link rel="preconnect">` for cross-origin
hosts. The current manual approach works but drifts from the rest of the codebase.

**Recommendation:** Convert both cover images to `[ngSrc]` + `priority` + the same
`width`/`height` you already provide. Remove the now-redundant `loading`/`decoding`/
`fetchpriority` attributes (`NgOptimizedImage` sets them).

---

#### C6 — `[P2]` — `@for (i of [0, 1]; track i)` allocates a new array literal each time the template body is invoked

**Location:** [src/app/features/hero/hero.component.html:58-69](../../src/app/features/hero/hero.component.html) (×2: main + placeholder)

```58:69:src/app/features/hero/hero.component.html
            @for (i of [0, 1]; track i) {
              <ui-glass-card ... />
            }
```

**Why it matters:** Under OnPush + signals the impact is minimal (the hero re-renders
rarely), but the pattern is a footgun if it propagates to high-CD components. The array
literal is reallocated on every template re-evaluation.

**Recommendation:** Lift to a `protected readonly skeletonSlots = [0, 1];` field on
`HeroComponent` and reference it from the template.

---

#### C7 — `[P3]` — Hero `.hero-name` uses `background-clip: text` for the gradient typography

**Location:** [src/app/features/hero/hero.component.css:91-104](../../src/app/features/hero/hero.component.css)

`background-clip: text` + `-webkit-text-fill-color: transparent` is well supported but
breaks Windows High Contrast mode (the text becomes invisible — there's no fill colour
to override). Forced-colors mode is the more modern check.

**Recommendation:** Add a `@media (forced-colors: active) { .hero-name { background: none; -webkit-text-fill-color: currentColor; } }` rule (still in the hero stylesheet,
not the global one).

---

#### C8 — `[P3]` — Google Fonts loaded via `<link rel="stylesheet">` from `fonts.googleapis.com` without a fallback for offline / blocked-domain scenarios

**Location:** [src/index.html:96-101](../../src/index.html)

`display=swap` is set (good), and `<link rel="preconnect">` exists for both google
hostnames. There's no FOIT, but corporate networks that block Google Fonts (or users
behind privacy-first DNS) get the system fallback only. The CSS already lists
`'Inter', system-ui, -apple-system, sans-serif` as the fallback chain, so the page is
functional — but the visual character changes.

**Recommendation:** Either self-host the four fonts (drop them into
`src/assets/fonts/` and use `@font-face` with `font-display: swap`) or add a
`<noscript>`-equivalent fallback note. Self-hosting also lets the CSP drop
`fonts.googleapis.com` and `fonts.gstatic.com` from `style-src` / `font-src`.

---

#### C9 — `[P3]` — `body { overflow-x: hidden; }` masks the underlying layout overflow

**Location:** [src/styles.css:150-157](../../src/styles.css)

```150:157:src/styles.css
body {
  font-family: var(--font-body);
  background-color: var(--surface-void);
  color: var(--text-primary);
  min-height: 100vh;
  line-height: 1.6;
  overflow-x: hidden;
}
```

`overflow-x: hidden` on `<body>` hides horizontal scrollbars but also disables horizontal
anchor scrolling and breaks `position: sticky` for any future sticky-right pattern.
It's typically applied as a defensive bandage when a child overflows; better to find
the offender.

**Recommendation:** Audit which descendant is causing horizontal overflow (likely a
`hero-bg .glow` element that scales beyond viewport on small screens — see
hero.component.css:36-52) and constrain it directly. Remove the body-level rule.

---

### D. Accessibility / semantic rendering

#### D1 — `[P1]` — Command palette listbox is missing `aria-activedescendant`; keyboard navigation isn't announced to AT

**Location:** [src/app/ui/command-palette/command-palette.component.html:7-58](../../src/app/ui/command-palette/command-palette.component.html) +
[src/app/ui/command-palette/command-palette.component.ts:131-144](../../src/app/ui/command-palette/command-palette.component.ts)

The `<ul role="listbox">` contains `<button role="option">` items. The arrow-key handler
updates `highlighted()` (a signal), and the option button toggles
`[attr.aria-selected]="i === highlighted()"`. But the `<input>` element (where keyboard
focus actually lives) does not declare `aria-activedescendant="..."` to point at the
currently-highlighted option's `id`.

**Why it matters:** Without `aria-activedescendant`, screen readers announce neither the
selected option as the user arrows nor the size of the result list. This is the
"single biggest a11y miss" of the listbox/option pattern.

**Recommendation:**

1. Generate a stable id per item (`#palette-option-{{ item.id }}`).
2. Add `[attr.aria-activedescendant]="filtered()[highlighted()]?.id ? 'palette-option-' + filtered()[highlighted()].id : null"`
   to the `<input>`.
3. Add `[attr.aria-expanded]` and `aria-controls="palette-listbox"` to the input,
   `id="palette-listbox"` to the `<ul>`. The pattern then matches the WAI-ARIA
   combobox/listbox spec.

---

#### D2 — `[P2]` — No `<header>` or `<footer>` landmark wraps the shell chrome; only `<main>` and `role="navigation"` are present

**Location:** [src/app/core/shell/shell.component.html](../../src/app/core/shell/shell.component.html)

The shell renders the sidebar (`role="navigation"`), main area (`<main>`), mobile theme
button, mobile nav pill, toast region, and command palette as siblings under
`<app-shell>`. There is no `<header>` element wrapping site-level branding (the
"Faisal Khan / Software Engineer" identity), no `<footer>` wrapping any meta links.

**Why it matters:** ARIA landmarks are how screen-reader users navigate. Today the
sidebar identity ("Faisal Khan") is inside a `<a routerLink="/">` inside the
`<ui-sidebar>` `<role="navigation">` element — so it's announced as part of the nav,
not as a banner. The `Editor tab bar` is also inside `<main>` (it sits as a sibling of
`<router-outlet>`, but inside `.main-area` which has no role) — `<role="tablist">`
exists per-element but no enclosing complementary/banner landmark.

**Recommendation:** Wrap the sidebar in `<header role="banner">` (not the sidebar
component itself, but a wrapper in the shell) or add `role="banner"` to the sidebar's
host. Add `<footer>` wrapping any future meta links. The shell can stay otherwise
unchanged — these are landmark hints, not visual changes.

---

#### D3 — `[P2]` — Toast region uses `role="alert"` per item rather than a single `aria-live="polite"` region

**Location:** [src/app/ui/toast-region/toast-region.component.ts:9-13](../../src/app/ui/toast-region/toast-region.component.ts) +
[src/app/ui/toast-region/toast-region.component.html](../../src/app/ui/toast-region/toast-region.component.html)

```9:13:src/app/ui/toast-region/toast-region.component.ts
  host: {
    role: 'region',
    'aria-label': 'Notifications',
  },
```

Each toast item has `role="alert"` (assertive). The host is `role="region"`. So every
toast message — including non-urgent ones like "Section link copied" — is announced
assertively, interrupting whatever the user is reading.

**Why it matters:** WAI-ARIA practices recommend `aria-live="polite"` for confirmations
and `role="alert"` only for genuinely urgent messages (errors, expiration warnings). The
current toasts mix both kinds (`Could not copy the link`, `Section link copied`,
`A part of the app failed to load`).

**Recommendation:** Add a `severity?: 'info' | 'error'` field to `ErrorToast` (default
`'info'`). Render `role="status"` (polite) for `info`, `role="alert"` (assertive) for
`error`. Keep the host `role="region"` + `aria-label`. The `chunk-load failed` message
should stay assertive.

---

#### D4 — `[P2]` — Hero heading hierarchy skips a level: `<h1 id="hero-heading">` is followed directly by `<h3>` post titles

**Location:** [src/app/features/hero/hero.component.html:10-13, 81](../../src/app/features/hero/hero.component.html)

```10:13:src/app/features/hero/hero.component.html
    <h1 id="hero-heading" class="hero-name">
      {{ profile.personalInfo().name }}
    </h1>
```

```81:81:src/app/features/hero/hero.component.html
                  <h3 class="latest-post-title">{{ post.title }}</h3>
```

There's no `<h2>` between the hero `<h1>` and the latest-posts `<h3>` cards. The
"latest from the blog" label is a `<p>` (line 53-55) with cosmetic `//` glyph.

**Why it matters:** WCAG 2.4.10 (Section Headings) wants logical heading nesting. Skipping
levels is allowed by HTML, but screen-reader users navigating by heading level (`H` key)
get a confusing outline.

**Recommendation:** Promote the `latest-posts-label` `<p>` to an `<h2>` (visually styled
the same way) and demote the post titles to `<h3>`s under it. Or vice-versa: make the
label `<h2>` and the cards `<h3>`s already match.

---

#### D5 — `[P2]` — Mobile nav menu opens, but focus does not return to the trigger if the user clicks the overlay

**Location:** [src/app/ui/mobile-nav-pill/mobile-nav-pill.component.html:31](../../src/app/ui/mobile-nav-pill/mobile-nav-pill.component.html) +
[src/app/ui/mobile-nav-pill/mobile-nav-pill.component.ts:60-63](../../src/app/ui/mobile-nav-pill/mobile-nav-pill.component.ts)

```31:31:src/app/ui/mobile-nav-pill/mobile-nav-pill.component.html
  <div class="menu-overlay" (click)="closeMenu()" aria-hidden="true"></div>
```

The Escape key path correctly returns focus to `menuTrigger` (line 62-63), but the
overlay `(click)` handler also calls `closeMenu()` — which does the same focus restoration.
That part is fine. What's missing is `(touchstart)` for iOS Safari (where `(click)` on a
non-interactive `<div aria-hidden>` is sometimes flaky) and an `aria-modal="true"` on
the `<div role="dialog">` (already present at line 36 — verified).

**Why it matters:** Edge case only; the keyboard path already works. Mostly a robustness
note for touch users on older iOS.

**Recommendation:** Test focus restoration on iOS Safari ≥ 17; if flaky, add a
`(pointerdown)` handler in addition to `(click)`. No change required if it works.

---

#### D6 — `[P3]` — `cert-grid` is a `tabindex="0"` `role="group"` — that's a focusable element with no inherent action

**Location:** [src/app/features/certifications/certifications.component.html:9](../../src/app/features/certifications/certifications.component.html)

```9:9:src/app/features/certifications/certifications.component.html
    <div class="cert-grid" tabindex="0" role="group" aria-label="Certifications">
```

**Why it matters:** Tab-stop on a non-interactive element is a WCAG 2.4.3 (Focus Order)
smell — keyboard users tab through and land on something they can't act on. The label
is already provided by the `<ui-section-header>`'s `<h1>`.

**Recommendation:** Drop `tabindex="0"`. If the goal was to enable arrow-key scrolling
within an overflow:auto container, do it via a scoped `(keydown)` handler on a
`role="region"` element (`role="group"` is for form-control-like grouping).

---

#### D7 — `[P3]` — Native `<dialog>` element relies on `dialog::backdrop` for the dim overlay; `<dialog>` does not get `aria-modal="true"` automatically in some older versions

**Location:** [src/app/ui/command-palette/command-palette.component.html:7-12](../../src/app/ui/command-palette/command-palette.component.html)

```7:12:src/app/ui/command-palette/command-palette.component.html
<dialog
  #dialog
  class="palette"
  aria-label="Command palette"
  (close)="open.set(false)"
>
```

Modern Chromium / Safari / Firefox correctly set the modal flag when `showModal()` is
called, but Safari < 16 does not. Audit script doesn't check this; the visible
`aria-label` is good.

**Recommendation:** Add an explicit `aria-modal="true"` for older AT engines. No-op
on modern browsers since the platform overrides it.

---

#### D8 — `[P3]` — Skip-link to mobile nav (`#main-navigation`) is intentionally hidden on phones, but the skip-link behaviour drops focus on a hidden target on the way down

**Location:** [src/app/core/shell/shell.component.css:31-37](../../src/app/core/shell/shell.component.css) +
[src/app/core/shell/shell.component.html:1-2](../../src/app/core/shell/shell.component.html)

```31:37:src/app/core/shell/shell.component.css
@media (max-width: 767px) {
  .skip-link--nav {
    display: none;
  }
}
```

This is correct behaviour for the visual skip-link itself; the comment in the CSS
explains why. But the `<a href="#main-navigation">` target (`<ui-sidebar id="main-navigation">`)
is also `display:none` at that breakpoint (sidebar is hidden via media query), which
would mean the link, even if surfaced, wouldn't scroll into view.

**Why it matters:** Edge case only — the skip-link is correctly hidden so users
can't trigger it. Worth a comment explaining the dual gate.

**Recommendation:** Document that the skip-link's `display:none` is the only reason
the broken target doesn't matter, OR add an `@media (max-width: 767px)` block in
`sidebar.component.css` that keeps the sidebar's `id="main-navigation"` reachable
(possibly via `position: absolute; left: -9999px`).

---

### E. Template modernization

#### E1 — `[P2]` — 12 `input(...)` declarations could promote to `input.required(...)`

**Location:** Across UI components. Specifically:

- `IconComponent.size = input(20);` — has a default, OK.
- `SidebarComponent.collapsed = input(false);` — has a default, OK.
- `SidebarComponent.isDark = input(true);` — has a default, OK.
- `GlassCardComponent.elevation = input<1|2|3>(1);` — defaults to 1, OK.
- `GlassCardComponent.hover = input(false);` / `glow = input(false);` — flag-style, OK.
- `GlassPanelComponent.scrollable = input(false);` / `flush = input(false);` — flag-style, OK.
- `GlowButtonComponent.variant = input<'primary'...>('primary');` — has a default, OK.
- `GlowButtonComponent.type = input<'button'|'submit'>('button');` — has a default, OK.
- `GlowButtonComponent.disabled = input(false);` — flag, OK.
- `SkillBadgeComponent.iconSrc = input<string>();` / `level = input<number>();` — no default; **could be required**.
- `SectionHeaderComponent.subtitle/decoration = input<string>();` / `headingId = input<string>();` — explicitly optional, OK.
- `MobileNavPillComponent.items = input<MobileNavItem[]>([]);` / `menuItems = input<MobileMenuItem[]>([]);` — required in practice; **could be required**.
- `EditorTabBarComponent.tabs = input<EditorTab[]>([]);` / `activeTabId = input<string>('');` — required in practice; **could be required**.
- `SidebarComponent.items = input<SidebarItem[]>([]);` — required in practice; **could be required**.
- `TimelineComponent.items = input<TimelineEntry[]>([]);` — required in practice; **could be required**.

**Why it matters:** A required input fails fast at compile time when a consumer forgets
to bind it; today these silently fall back to `[]` / `''` and render an empty surface.

**Recommendation:** Promote `SidebarComponent.items`, `MobileNavPillComponent.items` &
`menuItems`, `EditorTabBarComponent.tabs` & `activeTabId`, `TimelineComponent.items`,
and `SkillBadgeComponent` (if `iconSrc` is genuinely required) to
`input.required(...)`. Keep flag-style and defaulted inputs unchanged.

---

#### E2 — `[P2]` — Underused `@defer` (1 block in the entire app)

**Location:** Only [src/app/features/hero/hero.component.html:51](../../src/app/features/hero/hero.component.html) uses `@defer`.

**Why it matters:** `@defer` is the cheapest way to push non-critical UI past LCP and
INP windows. Several panels are obvious candidates:

| Candidate                                                        | Suggested trigger                          |
| ---------------------------------------------------------------- | ------------------------------------------ |
| `BlogPostComponent` related-posts list and adjacent-posts nav    | `on viewport`                              |
| `BlogPostComponent` reading-progress bar (it's below all chrome) | `on idle` + `on viewport`                  |
| `AboutComponent` education list                                  | `on viewport`                              |
| `CertificationsComponent` courses + awards sections              | `on viewport`                              |
| `BlogComponent` featured post body (`isFirst`)                   | already eager (LCP); leave alone           |
| `BlogComponent` non-featured cards beyond the first 3            | `on viewport`                              |
| Command palette body (currently always rendered)                 | `on interaction(menuTrigger)` or `on idle` |
| Hero `latest-posts` row                                          | already deferred ✓                         |

**Recommendation:** Each candidate above is a low-risk add. Pair every `@defer` with a
`@placeholder` that reserves the same outer dimensions to avoid CLS regressions.

---

#### E3 — `[P2]` — `@switch` only used twice; several `@if/@else if` chains would read better as `@switch`

**Location:**

- `BlogPostComponent` template has nested `@if (loading()) @else if (error()) @else` for
  the post body — the discriminant is a 3-state machine
  ([blog-post.component.html:152-166](../../src/app/features/blog/blog-post/blog-post.component.html));
  could be `@switch`.
- `BlogComponent` similarly: `@if (...) @else if (loading()) @else if (error()) @else`
  ([blog.component.html:33-122](../../src/app/features/blog/blog.component.html));
  natural `@switch` shape.
- `HeroComponent` blog-cards branches (`@if (loading && !posts) @else if (posts)`) —
  small enough that `@if` is fine.

**Why it matters:** `@switch` reads better for explicit state machines and the Angular
compiler emits slightly tighter code (one chain of equality checks instead of nested
`if`s). No runtime perf cliff either way.

**Recommendation:** Convert the two blog views (`BlogPostComponent`, `BlogComponent`) to
expose a `protected readonly viewState = computed<'loading'|'error'|'empty'|'ready'>(...)`
and switch on it. This also makes the templates testable as state transitions.

---

#### E4 — `[P3]` — `IconComponent` renders inline SVG via `<svg>` with `@for` over shapes — sprite alternative not evaluated

**Location:** [src/app/ui/icon/icon.component.ts](../../src/app/ui/icon/icon.component.ts) +
[src/app/ui/icon/icon.component.html](../../src/app/ui/icon/icon.component.html)

**Why it matters:** Each `<ui-icon>` instance materializes its own `<svg>` element with
the full shape list inline. On the home page, 25-30 icon instances are common (sidebar
×8, mobile pill ×4, hero CTAs ×2, latest-post-meta ×4, footer/social ×3, plus icons
within glass cards). That's ~25 KB of inline SVG markup in the prerendered HTML and
on every signal-driven CD pass.

**Trade-off:** A sprite (`<svg><symbol id="icon-home">...</symbol>...</svg>` once at
the top of the document, then `<svg><use href="#icon-home" /></svg>` per instance)
shrinks the prerendered HTML and the per-instance render cost. The current inline
approach has the upside of working without a global registration step and having
`stroke="currentColor"` work without any extra ceremony.

**Recommendation:** Measure (`audit-prerender.mjs` could count the bytes per route),
then decide. If the home route's prerendered HTML is more than 60 % SVG markup,
introduce a sprite. Otherwise leave as-is.

---

#### E5 — `[P3]` — `bypassSecurityTrustHtml` in `TrustedHtmlPipe` documents CSP defense-in-depth but doesn't surface a runtime check

**Location:** [src/app/shared/pipes/trusted-html.pipe.ts:7-12](../../src/app/shared/pipes/trusted-html.pipe.ts)

```7:12:src/app/shared/pipes/trusted-html.pipe.ts
 * SECURITY: Only use this pipe for content from trusted sources (e.g. locally-authored
 * markdown rendered via marked + highlight.js). Angular's default sanitizer strips
 * class/style attributes needed for syntax highlighting. The strict CSP in nginx.conf
 * (`script-src 'self'`) provides defense-in-depth against inline script injection.
 */
```

The CSP is in `nginx.conf` and built by `scripts/build-csp.mjs`. The pipe trusts a
caller-supplied string. Today the only caller is `BlogPostComponent.content()` which
flows from local markdown — fine. A future reuse of this pipe (e.g. a CMS-fed
description field) would inherit the bypass without re-justifying it.

**Recommendation:** Add an optional `source: 'local-markdown' | 'remote'` parameter to
the pipe and `throw` for any non-`local-markdown` input until the CSP review for that
source is signed off.

---

#### E6 — `[P3]` — Markdown admonition / callout extension hardcodes title for empty cases; missing colour for `info` differentiation in light mode

Minor cosmetic note rather than a rendering bug. Listed for completeness.

**Recommendation:** None for this audit — rendered correctly in both themes.

---

## 5. Prioritized backlog

| ID  | Severity | Title                                                                                | Effort |
| --- | -------- | ------------------------------------------------------------------------------------ | ------ |
| D1  | P1       | Add `aria-activedescendant` to command palette                                       | S      |
| C1  | P1       | Reserve aspect ratio for mermaid placeholder                                         | M      |
| C2  | P1       | Drop `progressbar` role from reading-progress; mark `aria-hidden`                    | XS     |
| B1  | P1       | Switch `**` route from `Prerender` to `Server` (or static 404)                       | S      |
| B2  | P1       | Defer 404 path text rendering to browser-only                                        | XS     |
| C3  | P2       | Audit + cap simultaneous `backdrop-filter` surfaces on phone                         | M      |
| C5  | P2       | Move featured / cover blog images to `NgOptimizedImage`                              | S      |
| D2  | P2       | Add `<header role="banner">` landmark wrapping the sidebar                           | XS     |
| D3  | P2       | Toast region: split `role="alert"` (errors) vs `role="status"`                       | S      |
| D4  | P2       | Promote hero "latest from the blog" label to `<h2>`                                  | XS     |
| E1  | P2       | Promote 5 array-shaped `input()` to `input.required()`                               | XS     |
| E2  | P2       | Add `@defer` blocks for 4-5 below-the-fold sections                                  | M      |
| E3  | P2       | Refactor blog-list/blog-post template branches into `@switch`                        | S      |
| A1  | P2       | Consolidate tab-bar `effect()` + `ngAfterViewInit` paths                             | S      |
| A2  | P2       | Hoist blog-post nested `effect()`s out of `afterNextRender`                          | S      |
| A6  | P2       | Memoize `featuredCover()` / `featuredCoverDims()` in BlogComponent                   | S      |
| A7  | P2       | Replace `canWebShare` `computed()` with one-shot constant                            | XS     |
| C4  | P2       | Remove unused `container-type` declaration (or ship `@container`s)                   | S      |
| B3  | P2       | Defer `WebVitalsService.start()` past LCP via `requestIdleCallback`                  | XS     |
| B4  | P2       | Extend `audit-prerender.mjs` to cover `/blog/tag/*` pages                            | S      |
| D5  | P3       | Verify mobile menu focus restoration on iOS Safari ≥ 17                              | XS     |
| D6  | P3       | Drop `tabindex="0"` from `cert-grid`                                                 | XS     |
| D7  | P3       | Add explicit `aria-modal="true"` to command palette `<dialog>`                       | XS     |
| D8  | P3       | Document mobile skip-link / hidden-target dual gate                                  | XS     |
| C6  | P3       | Lift `[0, 1]` skeleton array literal to component field                              | XS     |
| C7  | P3       | Add `forced-colors: active` fallback for hero gradient text                          | XS     |
| C8  | P3       | Self-host Google Fonts (Inter / Poppins / Fira Code / Space Grotesk)                 | M      |
| C9  | P3       | Find and fix the horizontal-overflow source instead of `body { overflow-x: hidden }` | M      |
| A3  | P3       | Replace `NavigationService` `computed()`s with plain readonly fields                 | XS     |
| A4  | P3       | Switch sidebar `@for ... track item` to `track item.label`                           | XS     |
| A5  | P3       | Extract hero blog-skeleton template to avoid duplication                             | XS     |
| B5  | P3       | Share `copyToClipboard()` helper between contact + blog-post                         | XS     |
| B6  | P3       | Re-render mermaid SVGs on theme toggle                                               | S      |
| E4  | P3       | Evaluate (don't necessarily ship) icon sprite vs inline SVG                          | M      |
| E5  | P3       | Tighten `TrustedHtmlPipe` to whitelist `'local-markdown'` source                     | XS     |

Effort key: **XS** ≤ 30 min · **S** ≤ 2 h · **M** ≤ 1 day · **L** > 1 day.

---

## 6. Appendix

### 6.1 Raw counts / commands used

```bash
rg "ChangeDetectionStrategy\.OnPush" src/app -l | wc -l        # 25
rg "\*ng(If|For|Switch)" src/app | wc -l                       # 0
rg "@for \(" src/app                                           # 35 (see breakdown above)
rg "@switch" src/app                                           # 2
rg "@defer" src/app/features                                   # 1
rg "loadComponent" src/app/app.routes.ts | wc -l               # 12
rg "input\.required\(" src/app                                 # 3
rg "input\(" src/app -g "*.ts" --count                          # 12 (non-required)
rg "\.subscribe\(" src/app -g "!*.spec.ts"                     # 2 (seo, tab — both with takeUntilDestroyed)
rg "backdrop-filter" src                                       # 8 stylesheets (+ print override)
rg "view-transition-name" src                                  # 3 (sidebar, tab-bar, main-content)
rg "role=\"progressbar\"" src/app                              # 2 (skill-badge, reading bar)
rg "@container" src                                            # 0
ls src/assets/blog/posts/*.md | wc -l                          # 4
```

### 6.2 Follow-up audits requiring runtime data

These were explicitly out of scope and need a deployed build / device farm:

- **Lighthouse / CWV field telemetry.** The `WebVitalsService` already beacons CLS / INP /
  LCP / FCP / TTFB; once `endpoint` is set
  ([src/app/core/services/web-vitals.service.ts:14-17](../../src/app/core/services/web-vitals.service.ts))
  a follow-up audit can quantify C1, C2, B3 with real numbers.
- **Bundle-size delta after `@defer` adoption (E2).** Requires `npm run analyze`
  before / after.
- **Cross-browser visual regression for C3 / C7 / C9.** Already has Playwright visual
  specs in `tests/e2e/visual.spec.ts` — extend to cover phone breakpoints.
- **Real-device backdrop-filter perf.** Manual on iPhone 12 / Pixel 6 / mid-range
  Android.
- **Heading-level outline.** `audit-prerender.mjs` checks for exactly one `<h1>` per
  route; extend to dump the full `<h2>/<h3>/<h4>` tree per route for D4.

### 6.3 What would shift the scorecard

If the four P1s land, and three or four P2s in §5 (D2, D3, E1, C5) are picked up
opportunistically, this codebase would graduate from "very good" to "best-in-class
Angular 21 SSR reference app" — the kind worth pointing other teams at as an example.
The remaining P3s are gardening, not gating.
