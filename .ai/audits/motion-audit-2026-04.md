# Fluxus Motion & Micro-interaction Audit — April 2026

**Branch:** `audit/motion-2026-04`
**Date:** 2026-04-25
**Status:** Implemented in full on 2026-04-25 — see [§ 1.1 Implementation status](#11-implementation-status).
**Scope:** Originally a read-only audit of every animation, transition, and micro-interaction
in the Angular 21 SSR app. Goal is a UX deliverable, not a perf one: does the app *feel*
inviting and elegant? Does every state change feel intentional? After the audit was
accepted, all 25 findings were implemented in a single follow-up pass; the
[Implementation status](#11-implementation-status) section below tracks landing details.

This is a companion to [.ai/audits/rendering-audit-2026-04.md](./rendering-audit-2026-04.md);
the same severity rubric applies and findings here are intentionally non-overlapping
with that audit's content.

---

## 1. Executive summary

Fluxus has a quiet, well-tokenized motion foundation — `--transition-fast / base / slow`
are defined once and reused almost everywhere, `prefers-reduced-motion` is honored
globally with thoughtful exceptions, View Transitions are already wired up at the
router level, and the reading-progress bar uses scroll-driven CSS with a rAF fallback.
Where the app falls short of "inviting and elegant" is in three places: **entrance
choreography is missing on most routes** (content snaps in instead of resolving),
**exit motion is missing** (toasts, mobile menu, dialogs vanish abruptly), and a
handful of **cohesion gaps** — three different blink mechanisms, an undefined
`--transition-medium` token, hardcoded `200ms` / `0.25s` durations that bypass the
token system, and an active-tab indicator that re-paints rather than slides.

| Severity | Count | What it means                                                                  |
| -------- | ----- | ------------------------------------------------------------------------------ |
| **P0**   | 0     | Correctness bug (broken animation that hangs DOM, runaway CPU, etc.).          |
| **P1**   | 7     | User-visible elegance gap on common paths; "snaps" where the design implies a transition. |
| **P2**   | 9     | Cohesion / consistency. Inconsistent durations, missing tactile feedback, untokened values. |
| **P3**   | 9     | Polish opportunities. Sliding active indicators, scroll-reveal stagger, copy-success delight. |

### 1.1 Implementation status

All 25 findings were implemented on 2026-04-25 in nine sequential phases. The
[Prioritized backlog](#5-prioritized-backlog) table below is the canonical
status reference; every row is now ✅ **Landed**. Highlights:

- **Foundations (Phase 1).** Replaced the 3-token transition system with a 6-token
  duration / easing pair (`--duration-fast / base / slow`,
  `--ease-standard / decelerate / accelerate`) plus composed
  `--transition-enter-base` / `--transition-exit-base` shorthands; preserved the
  legacy `--transition-fast / base / slow` names so existing call sites kept
  working. Added `-webkit-tap-highlight-color: transparent` globally and fixed
  documentation drift (D1, D2).
- **Press states (Phase 2).** `:active` now exists on glow-button (secondary +
  ghost), glass-card hoverable, sidebar nav / theme / resume, mobile pill
  items / menu links / close, editor-tab-bar (tab + close + close-all), toast
  action / dismiss, command-palette item, and the timeline dot. Added a
  `:focus-visible` ring on the command-palette input.
- **GPU friendliness (Phase 3).** Sidebar collapse refactored to a fixed-width
  rail with `transform: scaleX` + per-child counter-transforms (no width /
  margin layout per frame). Skill bar fill switched from `width %` to
  `transform: scaleX(var(--badge-fill-scale))`. Hero `.glow` widened
  `will-change` to match the keyframe (`transform, opacity`).
- **Route transitions (Phase 4).** Custom `::view-transition-old/new(main-content)`
  keyframes adopt the decelerate / accelerate pair with a 4 px translate.
  Theme toggle now wraps `theme.set()` in `document.startViewTransition()`
  (gated on browser support + `prefers-reduced-motion`).
- **Entrance choreography (Phase 5).** Single shared `.enter-fade-up` /
  `.fade-in` / `.fade-out` utilities in `styles.css`, applied via
  `animate.enter` / `animate.leave` to about, projects, skills, experience,
  certifications, contact, blog list / post / tag, and the hero "latest posts"
  swap. Per-card stagger via `--enter-delay` host bindings.
- **Exit motion (Phase 6).** Toast gets `animate.leave="toast-out"`; mobile
  menu overlay + panel get `animate.leave` versions of their open keyframes;
  command palette uses `@starting-style` + `transition-behavior: allow-discrete`
  for both directions of the dialog open / close.
- **Cohesion + forms (Phase 7).** Two unified blink keyframes (`cursor-blink`
  for opacity, `cursor-blink-border` for border-color) with a shared 1 s
  period replace the four per-component variants. Hero `pulse` and 404
  `glitch-shift` periods are now documented in code. Contact form animates
  every stage transition + every validation error reveal; submit flips the
  stage before `window.open()` so the click reads as instant.
- **Sliding indicator (Phase 8).** Single `tabs-scroll::after` bar driven by
  `--tab-indicator-x` / `--tab-indicator-width` host bindings replaces the
  per-tab underline. Sidebar gets the same pattern as `nav-list::before`
  driven from `NavigationEnd` events.
- **Audit doc (Phase 9).** This document now carries the implementation
  history and the prioritized backlog table is annotated with landing notes.

**Cited code locations are pre-implementation references** (line numbers
match the original snapshot). After Phase 1 everything below `Inventory
snapshot` should be read as historical context, not current state.

**Already excellent (no work required):**

- Centralized motion tokens — `--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)`,
  `--transition-base: 250ms`, `--transition-slow: 400ms`, all from
  [src/styles.css:84-87](../../src/styles.css). Used in 17+ stylesheets.
- Global `prefers-reduced-motion` override at
  [src/styles.css:844-872](../../src/styles.css) — collapses `*` animation/transition
  durations to `0.01ms`, neutralizes `::view-transition-*` pseudo-elements, and
  hides the decorative reading-progress bar so it never freezes at 100 %.
- Per-component reduced-motion overrides where the global rule could otherwise leave
  visual residue: `.skeleton-line` at
  [src/app/features/hero/hero.component.css:268-272](../../src/app/features/hero/hero.component.css)
  and `.toast` at
  [src/app/ui/toast-region/toast-region.component.css:99-103](../../src/app/ui/toast-region/toast-region.component.css).
- Reading progress uses `transform: scaleX()` from a fixed origin
  ([src/app/features/blog/blog-post/blog-post.component.css:152-166](../../src/app/features/blog/blog-post/blog-post.component.css))
  with a `@supports (animation-timeline: scroll())` upgrade at
  [src/styles.css:987-1002](../../src/styles.css) — compositor-only, with a JS fallback
  that short-circuits when CSS is supported.
- View Transitions enabled at the router level
  ([src/app/app.config.ts:30-40](../../src/app/app.config.ts)) plus named regions on
  `.content` ([shell.component.css:70](../../src/app/core/shell/shell.component.css)),
  `.sidebar` ([sidebar.component.css:11](../../src/app/ui/sidebar/sidebar.component.css)),
  and `.tab-bar` ([editor-tab-bar.component.css:9](../../src/app/ui/editor-tab-bar/editor-tab-bar.component.css)).
- Compositor-friendly motion everywhere it counts: glass-card hover uses
  `transform: translateY(-2px)` + `box-shadow` (not layout)
  ([glass-card.component.css:31-41](../../src/app/ui/glass-card/glass-card.component.css));
  project image hover uses `transform: scale(1.05)`
  ([projects.component.css:31-40](../../src/app/features/projects/projects.component.css));
  mobile menu panel uses `transform: translateY` keyframe
  ([mobile-nav-pill.component.css:203-210](../../src/app/ui/mobile-nav-pill/mobile-nav-pill.component.css)).
- `transition: all` is **not used anywhere** in the source tree.
- Single press state done right: `.btn--primary:active` at
  [glow-button.component.css:37-39](../../src/app/ui/glow-button/glow-button.component.css)
  flips `translateY(-1px)` → `translateY(0)` for tactile feedback.
- Focus-visible contract is documented and enforced for all `<a>` / `<button>` at
  [src/styles.css:169-192](../../src/styles.css) (2 px outline, 2 px offset, accent
  colour, contrast verified against both themes).

---

## 2. Methodology

- **Tools:** `rg` over `src/`, `Read` of every component CSS / template / TS that
  declares a `transition`, `animation`, `@keyframes`, `view-transition-name`,
  `:hover` / `:focus-visible` / `:active`, or `prefers-reduced-motion`.
- **Web research consulted (Appendix C for full list):** Material 3 motion tokens
  and easing specs; web.dev's compositor-only-properties guidance; MDN on
  `view-transition-name`, `@starting-style`, and `transition-behavior: allow-discrete`;
  Angular 21's `withViewTransitions` and `animate.enter` / `animate.leave` directives;
  WCAG 2.3.3 *Animation from Interactions*; Nielsen Norman Group on micro-interaction
  timing. Each P1 / P2 finding cites either a code location or one of these sources.
- **What was NOT verified at runtime:** Real-device 60 fps capture during scroll,
  INP measurements during interaction-heavy paths (open palette, type, navigate,
  close), live `requestAnimationFrame` traces under throttled CPU, real Safari /
  Firefox parity for View Transitions, motion-sickness user testing. Those require a
  deployed build and a small device farm; explicitly out of scope (see §6.2).
- **Non-goals:** Visual regression baselines, brand-level motion language definition,
  copy / interaction-design rewrites, third-party animation libraries (Motion One,
  GSAP, Framer Motion), or migration to `@angular/animations` (which is deprecated
  as of v20.2 anyway — see Appendix C).

### Severity rubric (carried over from rendering audit §2)

- **P0** — Correctness bug. Animation that wedges layout, leaks event listeners,
  blocks input, or visually breaks under reduced-motion.
- **P1** — User-visible elegance regression on a primary path. A state change that
  "snaps" where the design implies a transition; missing exit motion on a frequently
  triggered surface (toast, dialog, mobile menu); a layout-affecting transition that
  causes jank on low-end devices.
- **P2** — Cohesion / consistency. Inconsistent durations or easing across kindred
  surfaces; missing tactile feedback (`:active`); untokened values that drift over time.
- **P3** — Polish opportunity. No measurable issue today, but the next pass through
  the area is the time to elevate it (sliding indicators, scroll-reveal stagger,
  copy-success delight).

---

## 3. Inventory snapshot (baseline metrics)

These are the "we already passed" numbers — recorded so the next motion audit can
detect drift without re-walking the same files. The `Pre-impl` column is the
2026-04-25 audit baseline; `Post-impl` is the state after Phase 9 landed.

| Metric                                                          | Pre-impl              | Post-impl             | Notes                                                       |
| --------------------------------------------------------------- | --------------------- | --------------------- | ----------------------------------------------------------- |
| Stylesheets declaring `@keyframes`                              | 8                     | 9                     | Net change is small: `styles.css` absorbed the unified blink + the new `enter-fade-up` / `simple-fade-in` / `simple-fade-out` / `route-fade-*` rules; per-component `blink` / `tag-blink` / `blog-blink` were removed. |
| Distinct `@keyframes` rules                                     | 11                    | 14                    | Removed: `blink`, `tag-blink`, `blog-blink`. Added: `cursor-blink`, `cursor-blink-border`, `enter-fade-up`, `simple-fade-in`, `simple-fade-out`, `route-fade-in`, `route-fade-out`, `form-error-in`, `form-error-out`, `toast-out`, `overlay-fade-out`, `menu-panel-out`. |
| Components honoring `prefers-reduced-motion` locally            | 2                     | 6                     | Added: command-palette, mobile-nav-pill, toast (`.toast-out`), skill-badge, plus the global `enter-fade-up` / `fade-in` / `fade-out` utilities respect the `*` rule for free. |
| `view-transition-name` declarations                             | 3                     | 3                     | `main-content`, `sidebar`, `tab-bar`. Tab-bar still uses the auto-named transition from the router. |
| Custom `::view-transition-old(name)` / `::view-transition-new(name)` rules | 0          | 2                     | Custom decelerate / accelerate keyframes for `main-content`. The reduced-motion neutralizer is unchanged. |
| Motion duration tokens defined                                  | 3                     | 6 (+ 5 composed)      | Six core (`--duration-fast/base/slow`, `--ease-standard/decelerate/accelerate`) + composed `--transition-fast/base/slow/-enter-base/-exit-base`. |
| Distinct easing curves used                                     | 1 (+ keyword fallbacks) | 3 (+ keyword fallbacks) | `--ease-standard` (existing curve), `--ease-decelerate` (entrance), `--ease-accelerate` (exit). |
| Hardcoded transition / animation durations bypassing tokens     | 5                     | 1                     | Only the reading-progress bar's intentional `80ms` rAF cap remains. |
| Components with at least one `:active` rule                     | 1                     | ~12                   | glow-button (secondary + ghost), glass-card, sidebar (nav / theme / resume), mobile-nav-pill (item / link / close), editor-tab-bar (tab / close / close-all), toast (action / dismiss), command-palette item, timeline dot. |
| Components with at least one `:focus-visible` rule              | 5                     | 6                     | Added: command-palette input. |
| `-webkit-tap-highlight-color` declarations                      | 0                     | 1                     | Set on `html` to `transparent`. |
| `transition: all` declarations                                  | 0                     | 0                     | Still all property-scoped. |
| `will-change` declarations                                      | 1                     | 2                     | Hero `.glow` widened to `transform, opacity`; sidebar host gets `transform`. |
| `@starting-style` / `transition-behavior: allow-discrete` usage | 0                     | 1                     | Command palette dialog (body + backdrop) now uses both. |
| `IntersectionObserver` instances                                | 0                     | 0                     | Still zero — entrance choreography is template-driven. |
| `animation-timeline` declarations                               | 1                     | 1                     | Unchanged; comment fix only (D1). |
| `@angular/animations` imports                                   | 0                     | 0                     | Deprecated package still unused. |
| `animate.enter` / `animate.leave` template usages               | 0                     | 25+                   | Spans about, projects, skills, experience, certifications, contact, blog list, blog post, blog tag, hero (latest posts), toast region, mobile-nav-pill. |
| `document.startViewTransition()` call sites                     | 0                     | 1                     | Theme toggle (gated on support + reduced-motion). |
| Sliding active indicators                                       | 0                     | 2                     | Editor-tab-bar (X-axis) and sidebar nav (Y-axis), both driven by host CSS custom properties. |

---

## 4. Findings by dimension

Each finding has an ID (e.g. `T1`, `H3`), a severity, evidence with `file:line`
references, why it matters, and a recommended fix. No code is applied.

Sections:

- **T.** Tokens & motion-system foundations
- **H.** Hover, focus, and press states
- **G.** GPU friendliness / layout-affecting transitions
- **R.** Route transitions & View Transitions API
- **E.** Entrance choreography on first paint
- **X.** Exit & dismissal motion
- **C.** Cohesion of decorative motion
- **F.** Forms & feedback micro-interactions
- **M.** Mobile / touch polish
- **D.** Documentation drift around motion

### T. Tokens & motion-system foundations

#### T1 — `[P2]` — `--transition-medium` referenced as a fallback but never defined

**Location:** [src/app/features/blog/blog.component.css:103](../../src/app/features/blog/blog.component.css)

```97:108:src/app/features/blog/blog.component.css
.post-card-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Subtle zoom on hover mirrors the GlassCard hover lift. */
  transition: transform var(--transition-medium, 200ms ease-out);
}
```

**Why it matters:** `--transition-medium` is **not** declared in
[src/styles.css:84-87](../../src/styles.css), so this transition always falls through
to the inline default `200ms ease-out`. That value (a) drifts from `--transition-base`
(`250ms`) used by the rest of the card system and (b) silently locks this hover
zoom into a different feel from every other GlassCard hover. Either define
`--transition-medium` once (some design systems split fast/medium/slow at 150/250/400)
or drop the variable and use `--transition-base` directly.

**Recommendation:** Replace with `var(--transition-base)`, or — better — adopt the
3-curve token set described in T2.

---

#### T2 — `[P2]` — Single easing curve used for both enter and exit transitions

**Location:** [src/styles.css:84-87](../../src/styles.css)

```84:87:src/styles.css
  /* === Transitions === */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Why it matters:** `cubic-bezier(0.4, 0, 0.2, 1)` is Material 1's "standard" curve —
symmetric, suitable for state changes. Material 3 (and Apple HIG) explicitly split
into a **decelerate** curve for entering elements (slow at the end, lands gently)
and an **accelerate** curve for leaving elements (fast at the end, drops out
cleanly). Using one curve for everything is why the existing toast and mobile-menu
enter animations feel slightly off — they decelerate into place, but their (current)
leaves will reverse the same curve and feel sluggish. Material 3 spec'd values for
the web are
`cubic-bezier(0.05, 0.7, 0.1, 1.0)` (emphasized decelerate) and
`cubic-bezier(0.3, 0.0, 0.8, 0.15)` (emphasized accelerate)
([Material 3 motion tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)).

**Why it matters now:** This becomes a real cohesion problem the moment the exit
animations in §X get added — without two curves, every leave will feel like a
slowed-down enter.

**Recommendation:** Introduce a 6-token system before adding exit motion:

```css
--ease-standard:        cubic-bezier(0.2, 0, 0,    1);     /* state changes */
--ease-decelerate:      cubic-bezier(0.05, 0.7, 0.1, 1);   /* entering */
--ease-accelerate:      cubic-bezier(0.3, 0, 0.8, 0.15);   /* leaving */
--duration-fast:    150ms;
--duration-base:    250ms;
--duration-slow:    400ms;
```

Then keep `--transition-fast: var(--duration-fast) var(--ease-standard)` etc. as
shorthand aliases for the existing call sites, and define
`--transition-enter-base: var(--duration-base) var(--ease-decelerate)` /
`--transition-exit-base: var(--duration-base) var(--ease-accelerate)` for the new
enter/leave choreography.

---

#### T3 — `[P2]` — Hardcoded durations bypass the token system

**Locations:**

- [src/app/ui/toast-region/toast-region.component.css:24](../../src/app/ui/toast-region/toast-region.component.css)
  — `animation: toast-in 200ms ease-out;`
- [src/app/ui/mobile-nav-pill/mobile-nav-pill.component.css:90](../../src/app/ui/mobile-nav-pill/mobile-nav-pill.component.css)
  — `animation: slideUp 0.25s ease-out forwards;` (`0.25s` ≠ `--transition-base`'s
  `250ms` *value*, but the inline form drifts independently of the token).
- [src/app/ui/skill-badge/skill-badge.component.css:77](../../src/app/ui/skill-badge/skill-badge.component.css)
  — `transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);` (re-states the token's curve verbatim).
- [src/app/features/blog/blog-post/blog-post.component.css:164](../../src/app/features/blog/blog-post/blog-post.component.css)
  — `transition: transform 80ms linear;` (intentional — fast enough that the
  reading bar tracks scroll without lag; documented in
  comments :150-152).
- [src/app/features/not-found/not-found.component.css:165](../../src/app/features/not-found/not-found.component.css)
  — `animation: blink 1s step-end infinite;`

**Why it matters:** Every hardcoded value is one more spot where the design system
can drift. The `200ms` toast feels slightly faster than the `250ms` mobile menu
even though both are intended to be "default" speed. The skill-badge re-states the
token's exact curve; if that curve ever changes, the bar diverges silently.

**Recommendation:** Replace each non-intentional hardcoded value with a token (or
introduce a new token if the duration is genuinely a different category — e.g.
`--duration-progress: 600ms` for skill bars). Leave the 80 ms reading-bar value
where it is; its rationale is sound and documented.

---

### H. Hover, focus, and press states

#### H1 — `[P1]` — Command-palette search input has no replacement focus ring

**Location:** [src/app/ui/command-palette/command-palette.component.css:39-48](../../src/app/ui/command-palette/command-palette.component.css)

```39:48:src/app/ui/command-palette/command-palette.component.css
.palette-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font: inherit;
  font-size: 0.95rem;
  padding: 0;
}
```

**Why it matters:** `outline: none` strips the global focus ring contract from
[src/styles.css:182-192](../../src/styles.css). The input's `<dialog>` parent
opens with focus already on the input, so the lack of a visible focus indicator
is hidden until the user `Tab`s away and back — at which point there's nothing
distinguishing focus from blur. WCAG 2.4.13 (Focus Appearance) is technically
borderline because the dialog itself is focused, but a screen-reader user
navigating into the search field won't get the expected ring.

**Recommendation:** Replace `outline: none` with a `:focus-visible` ring scoped
to the input — e.g.
`.palette-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--radius-sm); }`.
The `outline: none` line can stay if a `box-shadow`-based ring is preferred to
avoid colliding with the rounded `.palette-frame`.

---

#### H2 — `[P2]` — `:active` press feedback is missing on every interactive surface except `.btn--primary`

**Locations (no `:active` rule):**

- Sidebar nav items, theme toggle, resume button —
  [sidebar.component.css:95-228](../../src/app/ui/sidebar/sidebar.component.css)
- Mobile nav pill items, menu links, menu close —
  [mobile-nav-pill.component.css:38-169](../../src/app/ui/mobile-nav-pill/mobile-nav-pill.component.css)
- Editor tabs, tab close, close-all button —
  [editor-tab-bar.component.css:54-161](../../src/app/ui/editor-tab-bar/editor-tab-bar.component.css)
- Hero social links, view-all link —
  [hero.component.css:151-321](../../src/app/features/hero/hero.component.css)
- Blog footer share buttons, breadcrumb links, back link —
  [blog-post.component.css:186-440](../../src/app/features/blog/blog-post/blog-post.component.css)
- Contact link button —
  [contact.component.css:100-117](../../src/app/features/contact/contact.component.css)
- 404 suggestion cards —
  [not-found.component.css:184-209](../../src/app/features/not-found/not-found.component.css)
- Mobile theme toggle (FAB) —
  [shell.component.css:97-115](../../src/app/core/shell/shell.component.css)
- `.btn--secondary`, `.btn--ghost` —
  [glow-button.component.css:41-64](../../src/app/ui/glow-button/glow-button.component.css)

**Why it matters:** When a user clicks or taps an interactive element, the visual
cue that the click registered is the press state. Without `:active`, the only
feedback is the route change / signal toggle that follows — which on a slow
connection or a busy main thread gives the user nothing for several hundred ms.
NN/G's micro-interaction guidance pegs press feedback at 100-150 ms — this is
specifically the budget where adding a `:active` state makes a click "feel
registered" before the resulting work completes
([NN/G — Microinteractions](https://www.nngroup.com/articles/microinteractions/)).
The pattern is already proven in this codebase by `.btn--primary:active`'s
`translateY(0)` flip ([glow-button.component.css:37-39](../../src/app/ui/glow-button/glow-button.component.css)).

**Recommendation:** Add a minimal press state to every interactive surface. Three
patterns cover almost everything:

1. Buttons that `translateY(-1px)` on hover → add `:active { transform: translateY(0); }`.
2. Background-fill controls (nav items, tabs) → add `:active { background: var(--accent-subtle); }`
   (one shade darker than the hover background).
3. Subtle text links → add `:active { opacity: 0.7; }` or one-step-darker colour.

---

#### H3 — `[P3]` — Timeline dot hover transition is instantaneous

**Location:** [src/app/ui/timeline/timeline.component.css:38-52](../../src/app/ui/timeline/timeline.component.css)

```38:52:src/app/ui/timeline/timeline.component.css
.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--surface-base);
  box-shadow: 0 0 8px var(--accent-glow);
  flex-shrink: 0;
  z-index: 1;
}

.timeline-entry:hover .timeline-dot {
  background: var(--accent-hover);
  box-shadow: 0 0 14px var(--accent-glow);
}
```

**Why it matters:** The hover state changes both `background` and `box-shadow`,
but `.timeline-dot` declares no `transition`, so both flip instantly. The rest of
the row (the GlassCard timeline-card) eases via its own GlassCard transition;
the dot snapping while the card eases creates a small but noticeable disjoin.

**Recommendation:** Add `transition: background-color var(--transition-fast),
box-shadow var(--transition-fast);` to `.timeline-dot`.

---

#### H4 — `[P3]` — Tab and sidebar active indicators re-paint instead of sliding

**Locations:**

- Editor tab bar — [editor-tab-bar.component.css:79-93](../../src/app/ui/editor-tab-bar/editor-tab-bar.component.css):
  the active marker is `.tab.active::after` (a 2 px line with accent glow)
  attached to whichever tab is currently active. Switching routes paints the
  bar onto the new tab and removes it from the old; there is no shared
  element that translates between positions.
- Sidebar nav — [sidebar.component.css:122-129](../../src/app/ui/sidebar/sidebar.component.css):
  active state is a `background` + `color` change on `.nav-item.active` with
  no leading bar, dot, or pill that animates.

**Why it matters:** The "magic move" of an active indicator sliding between
related items is one of the most recognised micro-interactions in design
systems (Material 3 navigation rail, iOS segmented control, VS Code tab bar).
On routes that change rapidly during a session — exactly the pattern this UI
encourages with its IDE-style chrome — the static repaint reads as utilitarian
where a slide reads as crafted. The two surfaces (tab bar and sidebar) are
the highest-leverage places in the app to introduce this affordance.

**Recommendation:** One positioned indicator per parent, driven by CSS
custom properties set from the active item's offset. Pseudo-code:

```css
.tabs-scroll {
  --tab-indicator-x: 0;
  --tab-indicator-width: 0;
}
.tabs-scroll::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: var(--tab-indicator-width);
  transform: translateX(var(--tab-indicator-x));
  background: var(--accent);
  box-shadow: var(--shadow-accent-glow);
  transition:
    transform var(--transition-base) var(--ease-decelerate),
    width var(--transition-base) var(--ease-decelerate);
}
.tab.active::after { content: none; }   /* drop the per-tab underline */
```

Sidebar follows the same shape with a left-edge bar. The TS side of
`EditorTabBarComponent` already tracks the active tab; computing
`offsetLeft` / `offsetWidth` of the active element and writing them as CSS
custom properties via host bindings is a few lines.

`prefers-reduced-motion` is already covered by the global override; the
indicator simply teleports under that media query.

---

### G. GPU friendliness / layout-affecting transitions

#### G1 — `[P1]` — Sidebar collapse animates `width` (layout property)

**Location:** [src/app/ui/sidebar/sidebar.component.css:1-20](../../src/app/ui/sidebar/sidebar.component.css)

```1:20:src/app/ui/sidebar/sidebar.component.css
:host {
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--surface-base);
  border-right: 1px solid var(--glass-border);
  padding: var(--space-6) 0;
  position: fixed;
  top: 0;
  view-transition-name: sidebar;
  left: 0;
  z-index: var(--z-sidebar);
  transition: width var(--transition-base);
  overflow: hidden;
}

:host(.collapsed) {
  width: var(--sidebar-collapsed);
}
```

Plus [shell.component.css:44-51](../../src/app/core/shell/shell.component.css) which
mirrors with `transition: margin-left var(--transition-base)` on the content area.

**Why it matters:** `width` and `margin-left` both trigger layout — every frame of
the 250 ms collapse runs through layout for the whole sidebar subtree (avatar,
nav items, footer) and the content column to its right. On a low-end Android
device this is the single most expensive transition in the app. web.dev's
compositor-only-properties guidance specifically calls out width/height as
animations to avoid where `transform` would do
([web.dev — Stick to compositor-only properties](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/)).

**Recommendation:** Two options, depending on how much the layout below the bar
should adapt during the animation:

- **Cheaper:** Keep the sidebar at full width but `transform: translateX(calc(-1 *
  (var(--sidebar-width) - var(--sidebar-collapsed))))`-shift it leftward, keeping
  only icons visible via `mask-image`. Content area's `margin-left` becomes
  `var(--sidebar-collapsed)` always, no transition needed. This is composited
  the entire way.
- **Closer to current behaviour:** Promote the sidebar to its own layer
  (`will-change: transform; contain: layout style`) and drive the visual width
  with a `transform: scaleX` on a fixed-width rail, with the content inside
  un-scaled via a counter-transform. More work, but visually identical to today.

The current width-based animation is acceptable on desktops with hardware
acceleration; it's specifically a phone / low-end-laptop concern. Pair the fix
with profiling on a Pixel 6 / iPhone 12 before/after.

---

#### G2 — `[P1]` — Skill-badge progress bar transitions `width` (layout property)

**Location:** [src/app/ui/skill-badge/skill-badge.component.css:64-78](../../src/app/ui/skill-badge/skill-badge.component.css)

```64:78:src/app/ui/skill-badge/skill-badge.component.css
.badge-bar {
  width: 100%;
  height: 3px;
  background: var(--surface-overlay);
  border-radius: var(--radius-pill);
  overflow: hidden;
  margin-top: var(--space-1);
}

.badge-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  border-radius: var(--radius-pill);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Why it matters:** Same reason as G1 — `width` is a layout property, and the
badge fills are 12+ on the skills page. They animate simultaneously on first
paint (after the value binding lands), each one running layout for the full
`.badge-inner` flex column. The `0.6s` duration multiplies the cost.

**Recommendation:** Animate `transform: scaleX` from `transform-origin: left`
against a fixed-width track. The bar already has the right structure — `.badge-bar`
is the track, `.badge-fill` is the fill — the change is one swap:

```css
.badge-fill {
  height: 100%;
  width: 100%;                                /* fill the track */
  transform-origin: left center;
  transform: scaleX(var(--level));            /* var bound from TS instead of width: % */
  transition: transform 0.6s var(--ease-decelerate);
}
```

with the component setting `[style.--level.percent]="level()"` (or `level()/100`
in `[style.--level]`) instead of `[style.width.%]`. References:
[web.dev — How to create high-performance CSS animations](https://web.dev/articles/animations-guide).

---

#### G3 — `[P3]` — Hero `.glow` declares `will-change: opacity` while keyframe also animates `transform`

**Location:** [src/app/features/hero/hero.component.css:20-35](../../src/app/features/hero/hero.component.css)

```20:35:src/app/features/hero/hero.component.css
.glow {
  position: absolute;
  border-radius: 50%;
  /*
    Smaller blur radius + isolated compositor layer = same visual feel at a
    fraction of the paint cost. The extra `transform: translateZ(0)` and
    `will-change: opacity` keep the orb on its own GPU layer so animating its
    opacity doesn't repaint the hero behind it. The animation itself is
    suppressed by the global `prefers-reduced-motion` rule in styles.css.
  */
  filter: blur(80px);
  opacity: 0.15;
  transform: translateZ(0);
  will-change: opacity;
  animation: pulse 8s ease-in-out infinite alternate;
}
```

But the `pulse` keyframe at lines 173-182 also animates `transform: scale(1)` →
`scale(1.2)`. The `will-change` hint promises `opacity` only, so the browser's
layer-promotion strategy may not anticipate the scale change.

**Why it matters:** It's a hint, not a correctness issue. But promoting layers
correctly for both animated properties is what keeps the orb composited.

**Recommendation:** Either widen to `will-change: transform, opacity` (paired
with a finalisation step that drops `will-change` after first paint if you're
worried about layer thrash), or drop `will-change` entirely since the pulse is
already an infinite alternate animation that the browser will heuristically
promote. Profiling will tell. References:
[web.dev — Stick to compositor-only properties](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/).

---

### R. Route transitions & View Transitions API

#### R1 — `[P2]` — Cross-route transitions use raw browser defaults (no `::view-transition-*` keyframes)

**Locations:**

- Router opt-in:
  [src/app/app.config.ts:30-40](../../src/app/app.config.ts) — `withViewTransitions()`.
- Named participants:
  [shell.component.css:70](../../src/app/core/shell/shell.component.css) (`main-content`),
  [sidebar.component.css:11](../../src/app/ui/sidebar/sidebar.component.css) (`sidebar`),
  [editor-tab-bar.component.css:9](../../src/app/ui/editor-tab-bar/editor-tab-bar.component.css) (`tab-bar`).
- Custom keyframes for those names: **none**. The only `::view-transition-*`
  rule in the source tree is the reduced-motion neutralizer at
  [src/styles.css:853-857](../../src/styles.css).

**Why it matters:** With `view-transition-name: main-content` set, the browser
already crossfades the content column between routes — but it does so at the
default duration (~250 ms in Chrome) with the default easing and no directional
slide. The sidebar and tab-bar stay still (good — they're named participants
that get matched across the navigation), but `main-content` itself just dissolves.
For a typing-and-coding-themed UI a directional slide (e.g. blog list → blog
post slides up; back button slides down) reads as more intentional than a
crossfade. References:
[MDN — Using the View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API/Using),
[web.dev — View transitions for SPAs](https://web.dev/learn/css/view-transitions-spas).

**Recommendation:** Add a small `::view-transition-old(main-content)` /
`::view-transition-new(main-content)` rule pair using
`--duration-base` + `--ease-decelerate`. Optionally add a directional axis
keyed off route depth (using `:active-view-transition-type(deeper)` once the
TYPES proposal lands in stable Chrome — currently behind a flag, so for now
keep it directionless). Minimal opening move:

```css
::view-transition-old(main-content) {
  animation: 200ms var(--ease-accelerate) both fade-out-up;
}
::view-transition-new(main-content) {
  animation: 250ms var(--ease-decelerate) both fade-in-down;
}
@keyframes fade-out-up {
  to   { opacity: 0; transform: translateY(-12px); }
}
@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(12px); }
}
```

`prefers-reduced-motion` is already neutralizing these via the `*` rule at
[src/styles.css:853-857](../../src/styles.css), so the reduced-motion contract
holds without further work.

---

#### R2 — `[P3]` — Theme toggle flips CSS variables instantly across the canvas

**Location:**
[src/app/core/services/theme.service.ts:30-37](../../src/app/core/services/theme.service.ts) +
the `[data-theme='light']` token block at
[src/styles.css:96-133](../../src/styles.css).

**Why it matters:** Toggling theme replaces the `:root` token values
synchronously. Only elements that include `background-color` and `color` in
their own `transition` declaration ease — everything else (the page void
background, glass-panel backgrounds without an explicit transition, prose body
colour) flips instantly. On a dark-to-light change in a bright room this is
mildly jarring. NN/G micro-interaction guidance treats theme changes as a
"system status" interaction that benefits from a short transition
([NN/G — Microinteractions](https://www.nngroup.com/articles/microinteractions/)).

**Recommendation:** Wrap `ThemeService.toggle()` in
`document.startViewTransition()` (gated on `CSS.supports`-style detection plus
`prefers-reduced-motion`). The browser then crossfades the entire document
once between the two token states with zero per-component transition work.
References:
[Angular — withViewTransitions](https://angular.dev/api/router/withViewTransitions),
[MDN — view-transition-name](https://developer.mozilla.org/docs/Web/CSS/view-transition-name).

```ts
toggle(): void {
  const next: Theme = this.isDark() ? 'light' : 'dark';
  if (this.isBrowser && 'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(() => this.theme.set(next));
  } else {
    this.theme.set(next);
  }
  if (this.isBrowser) localStorage.setItem(STORAGE_KEY, next);
}
```

---

### E. Entrance choreography on first paint

#### E1 — `[P1]` — Route bodies snap into place; only hero and 404 have ambient enter motion

**Locations (all routes other than hero / not-found):**

- About — [src/app/features/about/about.component.css](../../src/app/features/about/about.component.css)
- Projects — [src/app/features/projects/projects.component.css](../../src/app/features/projects/projects.component.css)
- Skills — [src/app/features/skills/skills.component.css](../../src/app/features/skills/skills.component.css)
- Experience — [src/app/features/experience/experience.component.css](../../src/app/features/experience/experience.component.css)
- Certifications — [src/app/features/certifications/certifications.component.css](../../src/app/features/certifications/certifications.component.css)
- Blog list — [src/app/features/blog/blog.component.css](../../src/app/features/blog/blog.component.css)
- Blog post — [src/app/features/blog/blog-post/blog-post.component.css](../../src/app/features/blog/blog-post/blog-post.component.css)
- Blog tag — [src/app/features/blog/blog-tag/blog-tag.component.css](../../src/app/features/blog/blog-tag/blog-tag.component.css)
- Contact — [src/app/features/contact/contact.component.css](../../src/app/features/contact/contact.component.css)

These templates lay out heading + cards + content with no `@keyframes`-backed
fade or translate. Once R1 lands, the route container itself eases via
View Transitions — but the cards inside still snap.

**Why it matters:** "Inviting and elegant" is doing most of its work in the
*entrance* of new content. Right now, a user clicking from `/blog` into a post
sees the blog list disappear (default crossfade) and the post body suddenly
exist. Material 3's choreography spec, Apple HIG, and NN/G all converge on a
short staggered fade-up for content blocks: 200-300 ms duration, 50-80 ms
stagger between siblings, decelerate easing
([Material 3 motion overview](https://m3.material.io/styles/motion/overview/specs)).

**Why now:** The cost of *not* doing this scales with the polish of everything
around it. The current static cards used to read as "minimal"; once R1 adds a
content-column slide, they'll read as "incomplete" because the column eases
but the content inside doesn't.

**Recommendation:** Define a single shared utility class once in `styles.css`,
and apply via `class.enter-fade-up` to the top level of each route's content
groups. Use Angular 21's `animate.enter` directive
([Angular — Enter and Leave animations](https://v21.angular.dev/guide/animations))
so the class is removed after the animation completes (no CSS-in-the-DOM):

```html
<section animate.enter="enter-fade-up">
  <ui-section-header ... />
  <div class="card-grid">
    @for (project of projects(); track project.id; let i = $index) {
      <ui-glass-card animate.enter="enter-fade-up" [style.--enter-delay]="i * 60 + 'ms'">
        ...
      </ui-glass-card>
    }
  </div>
</section>
```

```css
.enter-fade-up {
  animation: enter-fade-up 240ms var(--ease-decelerate) both;
  animation-delay: var(--enter-delay, 0ms);
}
@keyframes enter-fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .enter-fade-up { animation: none; }
}
```

**SSR / hydration note:** `animate.enter` only fires on client-side DOM insert
([Angular — Enter and Leave](https://v21.angular.dev/guide/animations)), so SSR-painted
content won't double-animate during hydration. This is the specific win over
the previous `@angular/animations` API and the reason `animate.enter` is the
recommended primitive in v21 ([Angular — Migrating to Native CSS Animations](https://angular.dev/guide/animations/migration)).
The first paint of every prerendered route is unaffected; only client-side
navigation triggers the choreography.

---

#### E2 — `[P2]` — Hero skeleton → content swap is a direct DOM swap with no crossfade

**Location:** [src/app/features/hero/hero.component.html](../../src/app/features/hero/hero.component.html)
+ [src/app/features/hero/hero.component.css:218-272](../../src/app/features/hero/hero.component.css)

The skeleton placeholder cards have the same outer dimensions as the real cards
(comment at line 220 explicitly notes this — "Same outer shape as the real card
so the layout never shifts"). When `latestPosts()` populates, the
`@if`-gated branch swaps to the real post cards instantly.

**Why it matters:** Layout doesn't shift (good), but the swap reads as a
hard cut: 4 shimmer bars vanish, 3 post cards appear. This is the same
"snaps" pattern as E1 but specifically on a loading-completion path where the
elegance bar is higher (the user is already watching the area).

**Recommendation:** Apply `animate.enter="fade-in"` to the real post-link
elements with the same shared utility from E1, and the existing skeletons
will fade to `display: none` via `@if`'s removal. Optionally fade the
skeletons out before the cards in (use `animate.leave="fade-out"` with a
slightly shorter duration). Both paths respect reduced-motion via the global
override at [src/styles.css:844-872](../../src/styles.css).

---

### X. Exit & dismissal motion

#### X1 — `[P1]` — Toasts have an enter animation but no exit; service code comments admit it

**Locations:**

- Enter keyframe: [toast-region.component.css:24-36](../../src/app/ui/toast-region/toast-region.component.css)
- Dismiss path: [error-toast.service.ts:32-34](../../src/app/core/services/error-toast.service.ts) —
  ```ts
  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
  ```
- Interface comment that anticipates exits but never delivered:
  [error-toast.service.ts:3-5](../../src/app/core/services/error-toast.service.ts) —
  ```ts
  export interface ErrorToast {
    /** Stable id so the host can dedupe and animate exits. */
    id: number;
    ...
  }
  ```

**Why it matters:** When the user clicks the dismiss `×` (or an action button
that resolves the error), the toast vanishes with no transition. The user's
attention was just trained on that surface; ripping it out is the opposite of
elegant. NN/G's micro-interaction guidance puts dismissal animation in the same
category as enter — both are part of the "feedback" loop and benefit from
~200 ms motion.

**Recommendation:** Use Angular 21's `animate.leave` directive
([Angular — Enter and Leave animations](https://v21.angular.dev/guide/animations))
on the toast item:

```html
<div class="toast" animate.enter="toast-in" animate.leave="toast-out" ...>
```

```css
.toast-out {
  animation: toast-out 180ms var(--ease-accelerate) both;
}
@keyframes toast-out {
  to { transform: translateY(8px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .toast-out { animation: none; }
}
```

Angular keeps the node in the DOM until the longest animation completes,
which exactly closes the gap noted in the `ErrorToast` interface comment.
References: [Angular animations migration guide](https://angular.dev/guide/animations/migration).

A pure-CSS alternative using `@starting-style` + `transition-behavior:
allow-discrete` works for explicit `display: none` toggles but doesn't help
here because the dismissal is an `@if` removal, not a `display` flip
([MDN — @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style),
[MDN — transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior)).

---

#### X2 — `[P1]` — Mobile menu close is an instant DOM removal

**Location:** [mobile-nav-pill.component.html](../../src/app/ui/mobile-nav-pill/mobile-nav-pill.component.html)
+ [mobile-nav-pill.component.css:75-91, 194-210](../../src/app/ui/mobile-nav-pill/mobile-nav-pill.component.css)

```75:91:src/app/ui/mobile-nav-pill/mobile-nav-pill.component.css
.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: calc(var(--z-nav-pill) + 10);
  animation: fadeIn var(--transition-base) forwards;
}

.menu-panel {
  position: fixed;
  inset: 0;
  background: var(--surface-base);
  z-index: calc(var(--z-nav-pill) + 11);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease-out forwards;
}
```

**Why it matters:** Open uses `fadeIn` + `slideUp`. Close (via `closeMenu()`
toggling the `@if`) is an immediate removal. On mobile, this is the most
frequently triggered transition in the app — and the asymmetry between
"slides up nicely" and "vanishes" is jarring.

**Recommendation:** `animate.leave="slide-down"` + `animate.leave="fade-out"`
on the panel and overlay respectively, with `--ease-accelerate` curves
(150-200 ms). Same shape as X1.

---

#### X3 — `[P2]` — Command palette `<dialog>` opens and closes without any motion

**Locations:**

- Open / close logic:
  [src/app/ui/command-palette/command-palette.component.ts:111-124](../../src/app/ui/command-palette/command-palette.component.ts) —
  `dialog.showModal()` / `dialog.close()`.
- CSS: [command-palette.component.css](../../src/app/ui/command-palette/command-palette.component.css) —
  no keyframes, no `@starting-style`.

**Why it matters:** The native `<dialog>` element is fully styled but appears
and disappears instantly. Cmd-K → palette there, Esc → palette gone, with no
scale-in or backdrop fade. The native focus trap + top-layer treatment is
already a big win (rendering audit 6.1 highlights this); the motion is the
last polish step.

**Recommendation:** Use `@starting-style` + `transition-behavior: allow-discrete`
to animate `<dialog>`'s open/close as part of CSS — no JS changes needed.
The pattern is now Baseline (since Aug 2024)
([MDN — @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style),
[LogRocket — Animating dialog with @starting-style](https://blog.logrocket.com/animating-dialog-popover-elements-css-starting-style/)):

```css
.palette {
  opacity: 0;
  transform: scale(0.96);
  transition:
    opacity var(--duration-base) var(--ease-decelerate),
    transform var(--duration-base) var(--ease-decelerate),
    overlay var(--duration-base) allow-discrete,
    display var(--duration-base) allow-discrete;
}
.palette[open] {
  opacity: 1;
  transform: scale(1);
}
@starting-style {
  .palette[open] {
    opacity: 0;
    transform: scale(0.96);
  }
}
.palette::backdrop {
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-decelerate),
              overlay var(--duration-base) allow-discrete,
              display var(--duration-base) allow-discrete;
}
.palette[open]::backdrop { opacity: 1; }
@starting-style {
  .palette[open]::backdrop { opacity: 0; }
}
```

Reduced-motion contract is already covered by the global rule at
[styles.css:844-872](../../src/styles.css).

---

### C. Cohesion of decorative motion

#### C1 — `[P2]` — Three "blink" cursors with three different mechanisms

**Locations:**

- `.loading-cursor` in blog list —
  [blog.component.css:222-235](../../src/app/features/blog/blog.component.css)
  uses `border-color: transparent` toggle, **0.6s**.
- `.loading-cursor` in blog tag —
  [blog-tag.component.css:155-168](../../src/app/features/blog/blog-tag/blog-tag.component.css)
  uses `border-color: transparent` toggle, **0.6s**. (Mirrors blog list — consistent.)
- `.loading-cursor` in blog post —
  [blog-post.component.css:365-378](../../src/app/features/blog/blog-post/blog-post.component.css)
  uses `border-color: transparent` toggle, **600ms**. (Same as blog list — consistent.)
- `.cursor-blink` in 404 terminal —
  [not-found.component.css:164-173](../../src/app/features/not-found/not-found.component.css)
  uses **`opacity: 0` toggle, 1s**. Different mechanism *and* different period.

**Why it matters:** The three blog-related cursors are cohesive (border toggle,
0.6 s). The 404 cursor is the odd one out — slower and uses opacity, which
gives a slightly softer fade-step than the border toggle's hard step. A user
who navigates from `/blog` to `/404` (intentionally or not) sees the same
visual archetype done two different ways.

**Recommendation:** Pick the 404's opacity mechanism (it reads better as a
"terminal cursor" because it goes fully invisible) and unify all four to it,
with a single shared keyframe and 0.8 s period (between the two extremes).
Or — equivalently — keep the border toggle for content cursors and the
opacity toggle for the explicit terminal aesthetic, but document the choice
in a comment. The current state reads as accidental.

---

#### C2 — `[P3]` — Hero ambient `pulse` + 404 `glitch-shift` use the same `ease-in-out` family but different periods

**Locations:**

- [hero.component.css:34, 173-182](../../src/app/features/hero/hero.component.css)
  — `pulse 8s ease-in-out infinite alternate`.
- [not-found.component.css:43-74](../../src/app/features/not-found/not-found.component.css)
  — `glitch-shift 4s ease-in-out infinite alternate`.

**Why it matters:** Both are deliberate ambient motion, both run continuously,
both use `ease-in-out alternate`. The 4s vs 8s split is intentional (404
glitch should feel more agitated; hero glow should feel slower) — this is
flagged as P3 for explicit acknowledgement, not action.

**Recommendation:** None. Document the intent in code comments so the next
contributor doesn't normalize the periods.

---

### F. Forms & feedback micro-interactions

#### F1 — `[P1]` — Contact form stage transitions snap; multi-step flow needs intent

**Location:** [contact.component.html:11-144](../../src/app/features/contact/contact.component.html) +
[contact.component.css:119-153](../../src/app/features/contact/contact.component.css)

The form is a 3-stage state machine: `editing` → `awaiting-confirmation` → `sent`,
toggled via `@switch (stage())`. Each branch is a different layout block
(`<form>`, `.confirm-state`, `.success-state`) with no enter/exit animation.

**Why it matters:** The user has just completed the most engagement-heavy
action on the site (writing and submitting a message). The reward is two
abrupt state swaps. NN/G specifically calls out form completion as a
high-leverage micro-interaction surface — small motion here measurably
increases perceived quality.

**Recommendation:** Use `animate.enter` on each `@switch` branch:

```html
@switch (stage()) {
  @case ('editing') {
    <form animate.enter="enter-fade-up" ...>...</form>
  }
  @case ('awaiting-confirmation') {
    <div animate.enter="enter-fade-up" class="confirm-state" ...>...</div>
  }
  @case ('sent') {
    <div animate.enter="enter-fade-up" class="success-state" ...>...</div>
  }
}
```

Reuses the E1 utility class. The aria-live regions
([contact.component.html:110, 134](../../src/app/features/contact/contact.component.html))
already announce the status — they just need motion to match the announcement.

---

#### F2 — `[P2]` — Form validation error messages snap into existence

**Location:** [contact.component.css:64-67](../../src/app/features/contact/contact.component.css) +
[contact.component.html:29, 48-55, 83](../../src/app/features/contact/contact.component.html)

```64:67:src/app/features/contact/contact.component.css
.form-error {
  font-size: 0.8rem;
  color: var(--error, #ef4444);
}
```

**Why it matters:** The input border eases to red via the
`.form-input` `transition: border-color` ([line 45-49](../../src/app/features/contact/contact.component.css)),
but the error text appears instantly below the field. Two related signals
animating asymmetrically reads as a small bug.

**Recommendation:** Add `animate.enter="enter-fade-up"` (or scope a smaller
`.form-error.enter` keyframe) to the `<span class="form-error">` so the error
text fades + slides in 4 px. Pair with `animate.leave` so resolving the error
also feels intentional. Reduced-motion is covered globally.

---

#### F3 — `[P3]` — Submit button has no loading state during `mailto:` open

**Location:** [contact.component.ts:58-69](../../src/app/features/contact/contact.component.ts)

```58:69:src/app/features/contact/contact.component.ts
onSubmit(): void {
  if (!this.contactForm.valid) return;

  const { name, email, subject, message } = this.contactForm.getRawValue();
  const mailto = `mailto:${this.profile.personalInfo().email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;

  if (this.isBrowser) {
    window.open(mailto, '_blank');
  }
  this.stage.set('awaiting-confirmation');
}
```

**Why it matters:** `window.open(mailto:...)` can hang the click for a
noticeable beat on slow systems while the OS spins up the mail client. During
that beat the Send button is still enabled and unchanged. The user might
double-click. The `awaiting-confirmation` stage already exists *after* the
`window.open` call — but until it sets, the user has no feedback that their
click registered.

**Recommendation:** Set the stage *before* calling `window.open`:

```ts
this.stage.set('awaiting-confirmation');
if (this.isBrowser) {
  window.open(mailto, '_blank');
}
```

Combined with F1, the user sees the form fade out and the confirm panel fade
in *as part of* the click. Optionally add a brief `:active` press state on the
Send button per H2.

---

### M. Mobile / touch polish

#### M1 — `[P3]` — `-webkit-tap-highlight-color` is not declared anywhere; mobile users get the browser default flash

**Location:** Repo-wide. `rg "-webkit-tap-highlight-color"` returns nothing.

**Why it matters:** On iOS Safari and Android Chrome, tapping any link/button
flashes a faint grey/blue rectangle behind the element. Combined with the
forthcoming H2 `:active` states and existing focus rings, that default flash
becomes redundant noise.

**Recommendation:** Add to `src/styles.css` global block:

```css
html {
  -webkit-tap-highlight-color: transparent;
}
```

Pair with the H2 `:active` states so press feedback isn't lost when the
browser default goes away.

---

### D. Documentation drift around motion

#### D1 — `[P3]` — Stale comment in blog-post mentions `scroll(nearest)` while CSS uses `scroll(root)`

**Locations:**

- Comment: [blog-post.component.ts:367-368](../../src/app/features/blog/blog-post/blog-post.component.ts) —
  `animation-timeline: scroll(nearest)`
- Implementation: [src/styles.css:991](../../src/styles.css) — `animation-timeline: scroll(root);`

**Why it matters:** The comment misleads future contributors about the actual
scroller binding. The styles.css comment block at lines 976-986 already
documents *why* `scroll(root)` was chosen over `scroll(nearest)`; the TS
comment apparently predates that decision.

**Recommendation:** One-word fix: change `nearest` to `root` in the comment.

---

#### D2 — `[P3]` — Print CSS comment names "theme FAB" but the implementation is `.mobile-theme-toggle`

**Location:** [src/styles.css:874-877](../../src/styles.css)

```874:877:src/styles.css
/* === Print stylesheet ===
   Hides all chrome (sidebar, tab bar, mobile nav pill, theme FAB, toast
   region, hero ambient layers, footer nav, copy buttons), expands the main
   content to full width, and switches to high-contrast black-on-white so
```

But the print rules at line 884-901 list `.mobile-theme-toggle`, not
`.theme-fab`. There's no `theme-fab` class in the source tree.

**Why it matters:** Ctrl-F by a future contributor for `theme-fab` returns
nothing — the comment hints at a class that doesn't exist.

**Recommendation:** Rename "theme FAB" to "mobile theme toggle" in the
comment, or add a `.theme-fab` alias if the FAB term is the preferred
internal vocabulary.

---

## 5. Prioritized backlog

| ID  | Severity | Title                                                                  | Effort | Status |
| --- | -------- | ---------------------------------------------------------------------- | ------ | ------ |
| H1  | P1       | Add `:focus-visible` ring to command-palette input                     | XS     | ✅ Landed |
| G1  | P1       | Replace sidebar `width` collapse with compositor-friendly transform    | M      | ✅ Landed (full `transform: scaleX` + counter-transform on direct children, `--sidebar-scale` host token, `contain: layout style`) |
| G2  | P1       | Replace skill-bar `width` transition with `transform: scaleX`          | S      | ✅ Landed (component now binds `--badge-fill-scale = level / 100`, fill anchored at `transform-origin: left center`) |
| E1  | P1       | Add `enter-fade-up` choreography across all routes via `animate.enter` | M      | ✅ Landed (about, projects, skills, experience, certifications, contact, blog, blog-tag, blog-post; per-card stagger via `--enter-delay`) |
| X1  | P1       | Add toast exit animation via `animate.leave`                           | S      | ✅ Landed |
| X2  | P1       | Add mobile menu close animation                                        | S      | ✅ Landed (overlay + panel use `animate.leave` reverse-playing the open keyframes) |
| F1  | P1       | Animate contact form stage transitions                                 | S      | ✅ Landed (`@switch` cases get `animate.enter` / `animate.leave`) |
| T1  | P2       | Define or remove `--transition-medium` in `blog.component.css`         | XS     | ✅ Landed (replaced with `var(--transition-base)`) |
| T2  | P2       | Adopt 6-token enter/exit easing system (`--ease-decelerate/accelerate`) | M     | ✅ Landed (six new tokens + composed `--transition-enter-base` / `--transition-exit-base`; legacy aliases preserved) |
| T3  | P2       | Replace remaining hardcoded durations with tokens                      | S      | ✅ Landed (toast, mobile menu) |
| H2  | P2       | Add `:active` press states across interactive surfaces                 | S      | ✅ Landed (~12 components) |
| R1  | P2       | Custom `::view-transition-old/new(main-content)` keyframes             | S      | ✅ Landed |
| E2  | P2       | Crossfade hero skeleton → real cards instead of direct swap            | XS     | ✅ Landed (real post cards get `animate.enter="fade-in"` with stagger) |
| X3  | P2       | Animate command-palette open/close via `@starting-style`               | S      | ✅ Landed (covers dialog body, transform, opacity, and backdrop blur) |
| C1  | P2       | Unify cursor blink mechanism (border vs opacity) across blog + 404     | XS     | ✅ Landed (two shared keyframes — `cursor-blink` for opacity, `cursor-blink-border` for the bordered loading cursors — both with a 1 s period) |
| F2  | P2       | Animate form validation error reveals                                  | XS     | ✅ Landed |
| H3  | P3       | Add hover transition to timeline dot                                   | XS     | ✅ Landed |
| H4  | P3       | Sliding active indicator for tab bar + sidebar                         | M      | ✅ Landed (single positioned bar per parent, driven by host CSS vars from `offsetLeft/Top` + `offsetWidth/Height`) |
| G3  | P3       | Reconcile hero `.glow` `will-change` with keyframe properties          | XS     | ✅ Landed (`will-change: transform, opacity`) |
| R2  | P3       | Theme toggle via `document.startViewTransition()`                      | S      | ✅ Landed (gated on support detection + `prefers-reduced-motion`) |
| C2  | P3       | Document hero `pulse` + 404 `glitch-shift` period intent in comments   | XS     | ✅ Landed |
| F3  | P3       | Set contact stage before `window.open` so submit feels instant         | XS     | ✅ Landed |
| M1  | P3       | `-webkit-tap-highlight-color: transparent` globally                    | XS     | ✅ Landed (on `html`, paired with the new `:active` press states) |
| D1  | P3       | Fix stale `scroll(nearest)` → `scroll(root)` comment                   | XS     | ✅ Landed |
| D2  | P3       | Rename "theme FAB" → "mobile theme toggle" in print-CSS comment        | XS     | ✅ Landed |

Effort key: **XS** ≤ 30 min · **S** ≤ 2 h · **M** ≤ 1 day · **L** > 1 day.

---

## 6. Appendix

### 6.1 Raw counts / commands used

```bash
rg "@keyframes" src                                               # 11 rules in 8 stylesheets
rg ":active" src/app -g "*.css" -l                                # 1 file (glow-button)
rg ":focus-visible" src -g "*.css" -c                             # 17 occurrences across 5 files + styles.css
rg "view-transition-name" src                                     # 3 (sidebar, tab-bar, main-content)
rg "::view-transition" src                                        # 1 (the reduced-motion neutralizer)
rg "@angular/animations" src                                      # 0
rg "animate\.(enter|leave)" src                                   # 0
rg "-webkit-tap-highlight-color" src                              # 0
rg "transition: all" src                                          # 0
rg "@starting-style|transition-behavior" src                      # 0
rg "will-change" src                                              # 1 (hero .glow)
rg "prefers-reduced-motion" src                                   # 3 (global + hero skeleton + toast)
rg "animation-timeline" src                                       # 1 (reading-progress)
rg "IntersectionObserver" src                                     # 0
```

### 6.2 Follow-up audits requiring runtime data

These are explicitly out of scope and need a deployed build / device farm:

- **Real-device 60 fps capture during the sidebar collapse** (G1) on iPhone 12
  / Pixel 6 / mid-range Android, before and after the `transform`-based fix.
- **INP measurements** during command-palette open → type → navigate → close,
  before and after X3. The `WebVitalsService` already beacons INP
  ([src/app/core/services/web-vitals.service.ts:14-17](../../src/app/core/services/web-vitals.service.ts));
  once `endpoint` is set a follow-up audit can quantify with field data.
- **Cross-browser View Transitions parity** (R1, R2). Chrome / Edge / Opera
  ship today; Safari Tech Preview and Firefox Nightly are partial. Manual
  smoke on each major browser.
- **Reduced-motion regression coverage.** The Playwright spec
  `tests/e2e/reduced-motion.spec.ts` already enforces the global contract
  (rendering audit 6.2). Extend to assert that `animate.enter` / `animate.leave`
  classes are no-ops under reduced-motion once E1, X1, X2, F1 land.
- **Motion-sickness UX testing.** The current motion budget is conservative;
  E1's stagger + R1's directional slide could become too much for some users
  even outside `prefers-reduced-motion`. Worth a short user test if the team
  has access.

### 6.3 References & best-practice sources

Annotated by section so each finding's recommendation traces back to a primary
source. All URLs were retrieved 2026-04-25.

**Motion systems**

- **Material Design 3 — Motion: easing and duration tokens.**
  [https://m3.material.io/styles/motion/easing-and-duration/tokens-specs](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
  Source for T2's emphasized decelerate `cubic-bezier(0.05, 0.7, 0.1, 1.0)` and
  accelerate `cubic-bezier(0.3, 0.0, 0.8, 0.15)` curves, plus the
  short / medium / long / extra-long duration token philosophy. Used by T2, T3,
  E1, R1, X1, X2, X3.
- **Material 3 — Motion overview.**
  [https://m3.material.io/styles/motion/overview/specs](https://m3.material.io/styles/motion/overview/specs)
  Source for the choreography-first framing in E1 (entering elements decelerate;
  leaving elements accelerate; symmetry signals nothing has changed).
- **Apple Human Interface Guidelines — Motion.**
  [https://developer.apple.com/design/human-interface-guidelines/motion](https://developer.apple.com/design/human-interface-guidelines/motion)
  Source for "motion as functional, not decorative" — quoted in E1's
  rationale.
- **Nielsen Norman Group — Microinteractions in User Experience.**
  [https://www.nngroup.com/articles/microinteractions/](https://www.nngroup.com/articles/microinteractions/)
  Source for H2's 100-150 ms press-feedback budget and X1 / R2's framing of
  dismissal and theme-change as "system status" interactions. Also the source
  for F1's claim that animated form-completion measurably increases perceived
  quality.

**Performance**

- **web.dev — Stick to Compositor-Only Properties and Manage Layer Count.**
  [https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/)
  Source for G1 / G2's claim that `width` triggers layout while `transform`
  stays on the compositor. Also informs G3's `will-change` discussion.
- **web.dev — How to create high-performance CSS animations.**
  [https://web.dev/articles/animations-guide](https://web.dev/articles/animations-guide)
  Source for the `transform: scaleX` / `transform-origin` pattern in G2's
  recommended fix. Also confirms `transition: all` should be avoided —
  reinforced by inventory finding (already 0 occurrences).
- **Chrome for Developers — A case study on scroll-driven animations performance.**
  [https://developer.chrome.com/blog/scroll-animation-performance-case-study](https://developer.chrome.com/blog/scroll-animation-performance-case-study)
  Confirms that the existing `animation-timeline: scroll()` reading-progress
  bar is the right pattern (compositor-only, survives main-thread blocking).
  Reinforces "Already excellent" §1.

**Platform APIs**

- **MDN — Using the View Transitions API.**
  [https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API/Using](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API/Using)
  Source for R1's `::view-transition-old(name)` / `::view-transition-new(name)`
  keyframe pattern.
- **MDN — `view-transition-name`.**
  [https://developer.mozilla.org/docs/Web/CSS/view-transition-name](https://developer.mozilla.org/docs/Web/CSS/view-transition-name)
  Source for R1 / R2 named-region matching semantics.
- **web.dev — View transitions for single-page applications.**
  [https://web.dev/learn/css/view-transitions-spas](https://web.dev/learn/css/view-transitions-spas)
  Source for R2's `document.startViewTransition()` opt-in for the theme toggle.
- **MDN — `@starting-style`.**
  [https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
  Source for X3's pure-CSS `<dialog>` open animation. Baseline since Aug 2024.
- **MDN — `transition-behavior`.**
  [https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior)
  Source for X3's `allow-discrete` value, which animates `display`-based
  transitions on `<dialog>`.
- **LogRocket — Animating dialog and popover with CSS @starting-style.**
  [https://blog.logrocket.com/animating-dialog-popover-elements-css-starting-style/](https://blog.logrocket.com/animating-dialog-popover-elements-css-starting-style/)
  Worked example informing X3's snippet structure.
- **MDN — Scroll-driven animation timelines.**
  [https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations/Timelines](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations/Timelines)
  Reference for the existing reading-progress bar; not currently a finding,
  but cited in §6.4 as a future affordance for scroll-reveal stagger.

**Angular 21 specifics**

- **Angular — Enter and Leave animations (v21).**
  [https://v21.angular.dev/guide/animations](https://v21.angular.dev/guide/animations)
  Source for `animate.enter` / `animate.leave` directive semantics used in
  E1, E2, F1, F2, X1, X2.
- **Angular — Migrating to Native CSS Animations.**
  [https://angular.dev/guide/animations/migration](https://angular.dev/guide/animations/migration)
  Confirms that `@angular/animations` is deprecated as of v20.2 — the package
  is in `package.json` but unused, and should stay unused.
- **Angular — `withViewTransitions` API.**
  [https://angular.dev/api/router/withViewTransitions](https://angular.dev/api/router/withViewTransitions)
  Source for R1's customization surface (`onViewTransitionCreated`,
  `skipInitialTransition`).

**Accessibility**

- **W3C — Understanding SC 2.3.3 Animation from Interactions.**
  [https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
  Source for the reduced-motion contract that all P1 / P2 recommendations
  must respect. Reinforces "Already excellent" §1.
- **W3C — C39: Using `prefers-reduced-motion` to prevent motion.**
  [https://www.w3.org/WAI/WCAG21/Techniques/css/C39.html](https://www.w3.org/WAI/WCAG21/Techniques/css/C39.html)
  Confirms the `@media (prefers-reduced-motion: reduce)` pattern at
  [src/styles.css:844-872](../../src/styles.css) is the WCAG-recommended
  technique.
- **web.dev — Animation and motion (a11y learning module).**
  [https://web.dev/learn/accessibility/motion](https://web.dev/learn/accessibility/motion)
  Confirms that *interactions* — not just decorative animation — count as
  motion under SC 2.3.3, which informs why the recommended E1 / X1 / X2
  patterns all explicitly degrade to `animation: none` under reduced-motion.

### 6.4 Inventory checklist for next audit

A diff-friendly version of §3 so the next pass can `rg` the same patterns and
detect drift. Run from the repo root.

```bash
# foundations
rg "@keyframes" src -c | wc -l                                    # ≤ 8 stylesheets
rg "@keyframes" src                                               # ≤ 11 distinct rules

# state coverage
rg ":active" src/app -g "*.css" -l | wc -l                        # ≥ 1; aim for ≥ 6 after H2
rg ":focus-visible" src -g "*.css" -c                             # ≥ 17

# tokens vs hardcoded
rg "transition:.*\d+(ms|s)" src -g "*.css"                        # only 80ms reading bar should be raw
rg "animation:.*\d+(ms|s)" src -g "*.css"                         # all should reference --duration-* once T3 lands

# view transitions
rg "view-transition-name" src                                     # ≥ 3
rg "::view-transition-(old|new)\(" src                            # ≥ 2 once R1 lands

# modern CSS
rg "@starting-style|transition-behavior" src                      # ≥ 2 once X3 lands
rg "animate\.(enter|leave)" src                                   # ≥ 4 once E1, X1 land

# anti-patterns
rg "transition: all" src                                          # must stay 0
rg "@angular/animations" src                                      # must stay 0 (deprecated since v20.2)

# reduced motion
rg "prefers-reduced-motion" src                                   # ≥ 3 (global + skeleton + toast)
```

### 6.5 What would shift the scorecard

If the seven P1s land (H1, G1, G2, E1, X1, X2, F1), the app crosses the
"feels intentional" threshold without needing any of the P2/P3 work. Specifically:

- Every interactive surface that changes state on click would have a press
  state (H2 doesn't strictly need to land for the P1s to feel right, but the
  combination is what produces the "every click is registered" texture).
- Every route navigation, form submission, and dismissal would have visible
  enter/exit motion, eliminating the "snaps" that currently make the app
  feel like a static prototype between the polished hero and the polished
  blog reader.
- The compositor-friendly fixes (G1, G2) keep the motion budget under
  control on the lowest-end devices the site is likely to encounter.

The P2 layer (T1-T3, R1, X3, C1, F2) is where the design language *cohesion*
lands — same easing across enter/exit, no mystery `--transition-medium`,
unified blink mechanism, branded route transitions, dialog open/close motion.

The P3 layer is genuine polish: timeline dot easing, theme-toggle View
Transitions, tap-highlight, comment cleanup. Worth picking up next time the
respective area is touched, not worth a dedicated pass.
