import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  untracked,
  DestroyRef,
  ElementRef,
  afterNextRender,
  PLATFORM_ID,
  TransferState,
  makeStateKey,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { httpResource } from '@angular/common/http';
import { DOCUMENT, NgOptimizedImage, isPlatformServer } from '@angular/common';
import { GlassPanelComponent } from '@ui/glass-panel/glass-panel.component';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { TrustedHtmlPipe } from '@shared/pipes/trusted-html.pipe';
import { BlogService } from '@core/services/blog.service';
import { MarkdownService } from '@core/services/markdown.service';
import { ProfileDataService } from '@core/services/profile-data.service';
import { ErrorToastService } from '@core/services/error-toast.service';
import { ThemeService } from '@core/services/theme.service';
import type { BlogPost } from '@shared/models/blog-post.model';
import { environment } from '@env/environment';
import { BlogPostSeoService } from './blog-post-seo.service';
import { MermaidService } from './mermaid.service';
import { slugify } from '@shared/utils/string.utils';
import { formatPostDate } from '@shared/utils/blog.utils';
import { copyToClipboard } from '@shared/utils/clipboard.utils';
import { prefersReducedMotion } from '@shared/utils/motion.utils';
import { blogPostUrl } from '@shared/utils/url.utils';
import { IMAGE_DIMS } from '@core/services/image-dims.generated';

/**
 * Drop the markdown body's leading `# Heading` line so the rendered HTML
 * doesn't duplicate the post title that the template already renders in
 * `.post-header h1`. Only the first non-empty line is considered, and the
 * line must match `^#\s+` (a single `#` followed by whitespace — i.e. an
 * H1). Any trailing CR (Windows line endings) is tolerated. Lower-depth
 * leading headings (`##`, `###`, ...) and mid-document H1s are preserved.
 */
function stripLeadingH1(md: string): string {
  const lines = md.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length) return md;
  // Strict match: exactly one `#` then whitespace. `##`, `###`, ... fall
  // through unchanged.
  if (!/^#\s+/.test(lines[i])) return md;
  // Drop the heading line plus a single trailing blank line so paragraph
  // spacing matches what the markdown originally implied.
  let j = i + 1;
  if (j < lines.length && lines[j].trim() === '') j++;
  return [...lines.slice(0, i), ...lines.slice(j)].join('\n');
}

/** Rendered markdown body + extracted table of contents. */
type RenderedPost = ReturnType<MarkdownService['renderWithToc']>;

const EMPTY_RENDER: RenderedPost = { html: '', toc: [] };

/**
 * Per-slug TransferState key for the server-rendered markdown. The prerender
 * pass writes the parsed result here so the client can reuse it instead of
 * re-running marked + highlight.js on the hydration frame.
 */
const renderStateKey = (slug: string) => makeStateKey<RenderedPost>(`blog-render:${slug}`);

@Component({
  selector: 'app-blog-post',
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.css',
  imports: [
    GlassPanelComponent,
    GlassCardComponent,
    IconComponent,
    NgOptimizedImage,
    RouterLink,
    TrustedHtmlPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent {
  private route = inject(ActivatedRoute);
  private blog = inject(BlogService);
  // MarkdownService is injected here (not in BlogService) so the heavy
  // marked + highlight.js graph only ships with this lazy route chunk.
  private md = inject(MarkdownService);
  protected profile = inject(ProfileDataService);
  private toasts = inject(ErrorToastService);
  private theme = inject(ThemeService);
  private destroyRef = inject(DestroyRef);
  private elRef = inject(ElementRef);
  private blogSeo = inject(BlogPostSeoService);
  private mermaid = inject(MermaidService);
  private document = inject(DOCUMENT);
  private transferState = inject(TransferState);
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  /**
   * Reference to the `.post-layout` wrapper, populated by the first
   * `afterNextRender` callback. The two side-effect handlers below
   * (anchor href rewrite + mermaid render) read this signal so they can
   * be declared at construction time as plain `effect()`s rather than
   * being nested inside the render callback. Hoisting the effects keeps
   * reactivity declarations co-located with the component's state and
   * makes the dependency graph easier to reason about.
   */
  private readonly postLayout = signal<HTMLElement | null>(null);

  /**
   * Tracks every fire-and-forget `setTimeout` scheduled by the component
   * (link-copied badge reset, code-block copy-button reset) so they all
   * cancel cleanly on destroy. Without this, a timer that fires after
   * teardown would touch a detached DOM node or a now-orphan signal —
   * the calls are harmless but wasteful, and the Set is cheap.
   */
  private timers = new Set<ReturnType<typeof setTimeout>>();

  protected readonly slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')), {
    initialValue: '',
  });

  // Reactive markdown body. Re-fires automatically when slug() changes and
  // resets to the empty default while loading — fixing the stale-content
  // flash that the previous subscribe-based pipeline had.
  private postBody = httpResource.text(
    () => {
      const slug = this.slug();
      // Validate the slug shape before it reaches the fetch URL. Every real
      // post slug is lowercase-kebab (verified against posts.json), so this
      // rejects '.', '/', '%', and uppercase — closing the route-param ->
      // asset-path traversal vector. Production nginx (`try_files … =404`,
      // no SPA fallback) already 404s a crafted URL before this component
      // boots, so this primarily hardens the dev server / pure-SPA path and
      // guards against regressions. A non-matching slug falls through to the
      // existing 'Post not found' branch.
      return slug && /^[a-z0-9-]+$/.test(slug) ? `assets/blog/posts/${slug}.md` : undefined;
    },
    { defaultValue: '' },
  );

  readonly meta = computed<BlogPost | undefined>(() => {
    const slug = this.slug();
    // Use `allPosts` (drafts included) so a direct draft URL still resolves
    // to its meta — drafts are excluded from list/feed/sitemap by `posts()`,
    // not from individual page rendering.
    return this.blog.allPosts().find((p) => p.slug === slug);
  });

  /**
   * Combined rendered HTML + extracted TOC, recomputed when the body changes.
   *
   * The leading `# Title` line of every post markdown file is stripped before
   * parsing because the post title is now rendered explicitly in
   * `.post-header h1` above the cover image — keeping the markdown's H1 here
   * would emit a duplicate heading inside `.prose`. Only the first non-empty
   * line is examined and only when it matches `^#\s+`, so mid-document H1
   * usage (rare, but legal) is preserved.
   */
  private readonly rendered = computed<RenderedPost>(() => {
    const slug = this.slug();

    /*
      Skip the client-side re-parse. marked + the synchronous highlight.js
      pass already ran during prerender; serialising the result into
      TransferState lets the client reuse it instead of re-running the whole
      graph on the hydration frame (a TBT/long-task spike on code-heavy posts,
      worst on throttled mobile). The render is deterministic, so the cached
      HTML matches the prerendered DOM exactly and hydration stays clean.
      `remove` frees the entry once consumed so it can't leak across an
      in-app navigation to another post.
    */
    if (!this.isServer && slug) {
      const key = renderStateKey(slug);
      if (this.transferState.hasKey(key)) {
        const cached = this.transferState.get(key, EMPTY_RENDER);
        this.transferState.remove(key);
        return cached;
      }
    }

    /*
      `httpResource.value()` *throws* when the resource is in an error
      state — the API surfaces failures imperatively rather than via a
      sentinel value. Reading `.error()` first means a 404/500 collapses
      to an empty render here (the dedicated `error()` computed below
      drives the user-visible error UI) instead of bubbling an
      uncaught exception out of every effect that depends on
      `content()` / `rendered()`.
    */
    if (this.postBody.error()) return EMPTY_RENDER;
    const raw = this.postBody.value();
    if (!raw) return EMPTY_RENDER;
    const result = this.md.renderWithToc(stripLeadingH1(raw));
    // Publish the parse for the client to reuse (prerender only).
    if (this.isServer && slug) this.transferState.set(renderStateKey(slug), result);
    return result;
  });

  readonly content = computed(() => this.rendered().html);

  /**
   * Visible only when the post has at least 4 h2-or-h3 headings — short posts
   * don't benefit from a TOC. The CSS additionally hides it on viewports
   * narrower than 1280 px.
   */
  readonly toc = computed(() => {
    const list = this.rendered().toc;
    return list.length >= 4 ? list : [];
  });

  readonly loading = computed(() => this.postBody.isLoading());

  readonly error = computed<string | null>(() => {
    if (this.postBody.error()) return 'Failed to load blog post';
    // Wait until the posts manifest has loaded before deciding "not found".
    if (this.blog.loading() || this.postBody.isLoading()) return null;
    if (this.slug() && this.blog.allPosts().length > 0 && !this.meta()) {
      return 'Post not found';
    }
    return null;
  });

  /**
   * Three-state machine for the post body — the template renders one branch
   * per state via `@switch (viewState())`. Driving the template from a single
   * discriminant (instead of nested `@if (loading()) @else if (error()) @else`)
   * makes the state transitions visible at a glance, and the Angular compiler
   * emits a flatter sequence of equality checks instead of nested conditionals
   * (small but free win).
   *
   * The `error()` signal already flips back to null while loading, so checking
   * `loading` first never masks a stale-error frame. Order: `loading -> error
   * -> ready` matches the visual progression in the rendered DOM.
   */
  readonly viewState = computed<'loading' | 'error' | 'ready'>(() => {
    if (this.loading()) return 'loading';
    if (this.error()) return 'error';
    return 'ready';
  });

  readonly adjacentPosts = computed(() => {
    const post = this.meta();
    return post ? this.blog.getAdjacentPosts(post.slug) : { prev: undefined, next: undefined };
  });

  readonly hasAdjacent = computed(() => {
    const adj = this.adjacentPosts();
    return !!(adj.prev || adj.next);
  });

  /** Up to 3 posts that share the most tags with this one. */
  readonly relatedPosts = computed(() => {
    const slug = this.slug();
    return slug ? this.blog.getRelatedPosts(slug, 3) : [];
  });

  /** Series metadata for the current post when it belongs to one. */
  readonly series = computed(() => {
    const slug = this.slug();
    return slug ? this.blog.getSeries(slug) : undefined;
  });

  /**
   * Intrinsic dimensions for the cover image, looked up from the build-time
   * IMAGE_DIMS map so the hero banner doesn't trigger CLS while it loads.
   * Falls back to a 16:9 placeholder so the layout still reserves space.
   */
  readonly coverDims = computed(() => {
    const cover = this.meta()?.cover;
    if (!cover) return { w: 1600, h: 900 };
    if (/^https?:/i.test(cover)) return { w: 1600, h: 900 };
    const key = cover.replace(/^\.?\/?/, '');
    const dim = IMAGE_DIMS[key];
    return dim ? { w: dim.w, h: dim.h } : { w: 1600, h: 900 };
  });

  /**
   * Reading time read straight from the manifest. The build script
   * `scripts/sync-reading-times.mjs` recomputes this from the markdown body
   * before every prod build (and is exposed as `npm run sync:reading-times`),
   * so manifest + prerender + SPA always agree.
   */
  readonly readingTime = computed(() => this.meta()?.readingTime ?? '');

  /** Locale-aware date label, e.g. "April 12, 2026". */
  readonly formattedDate = computed(() => {
    const date = this.meta()?.date;
    return date ? formatPostDate(date) : '';
  });

  /**
   * Pre-built share URLs for the post. Plain `<a href>` links to each
   * service's web intent — keeps third-party JS off the page entirely.
   */
  readonly shareUrls = computed(() => {
    const post = this.meta();
    const slug = this.slug();
    const url = encodeURIComponent(blogPostUrl(slug));
    const title = encodeURIComponent(post?.title ?? '');
    const summary = encodeURIComponent(post?.excerpt ?? '');
    return {
      twitter: `https://x.com/intent/tweet?text=${title}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      hackerNews: `https://news.ycombinator.com/submitlink?u=${url}&t=${title}`,
      email: `mailto:?subject=${title}&body=${summary}%0A%0A${url}`,
    };
  });

  readonly linkCopied = signal(false);

  /**
   * Mirrors `'share' in navigator` so the template can render the native
   * Share button only on platforms that support the Web Share API.
   *
   * Starts `false` so the prerendered HTML and the first client render
   * agree on "no Share button". A field initialiser of `typeof navigator
   * !== 'undefined' && …` produced `false` on the server (no navigator)
   * and `true` on the client (Web Share-capable browsers), which Angular
   * flagged as a hydration mismatch — the structural delta forced a node
   * re-creation and emitted a console error during hydration.
   *
   * Flipping to `true` inside `afterNextRender` (browser-only by
   * contract) keeps SSG and first paint identical, then the signal
   * update triggers a clean post-hydration render of the button. The
   * share row is a flex `flex-wrap` container so the button materialising
   * doesn't shift sibling layout.
   */
  readonly canWebShare = signal(false);

  /**
   * Invokes the native Share sheet (iOS/Android, Edge/Chrome on Windows,
   * Safari on macOS). Aborted shares (user cancelled) are silent — they
   * raise an `AbortError` we intentionally swallow. Any other failure
   * shows a toast so the user knows the action didn't take effect.
   */
  protected async shareViaWebShare(): Promise<void> {
    const post = this.meta();
    const slug = this.slug();
    if (!post || !slug) return;
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return;
    try {
      await navigator.share({
        title: post.title,
        text: post.excerpt,
        url: blogPostUrl(slug),
      });
    } catch (err) {
      // AbortError is the user dismissing the share sheet — not an error.
      if ((err as { name?: string })?.name === 'AbortError') return;
      this.toasts.push({
        title: 'Could not open the share sheet',
        detail: 'Use one of the other share options below instead.',
      });
    }
  }

  protected async copyShareLink(): Promise<void> {
    const slug = this.slug();
    if (!slug) return;
    const url = blogPostUrl(slug);

    if (await copyToClipboard(url)) {
      this.linkCopied.set(true);
      this.scheduleTimeout(() => this.linkCopied.set(false), 1500);
    } else {
      this.toasts.push({
        title: 'Could not copy the link',
        detail: 'Your browser blocked clipboard access — try copying the URL from the address bar.',
      });
    }
  }

  protected tagSlug(tag: string): string {
    return slugify(tag);
  }

  protected formatDate(iso: string): string {
    return formatPostDate(iso);
  }

  readonly scrollProgress = signal(0);

  /** Integer 0-100 for the reading bar's `aria-valuenow`. */
  readonly readingProgressLabel = computed(() => Math.round(this.scrollProgress()));

  constructor() {
    // Cancel any in-flight `setTimeout`s so the badge / button-reset
    // closures don't fire on a torn-down view.
    this.destroyRef.onDestroy(() => {
      for (const id of this.timers) clearTimeout(id);
      this.timers.clear();
    });

    // Update <title> + meta tags as the post resolves.
    effect(() => {
      const post = this.meta();
      if (post) untracked(() => this.blogSeo.updateMetaTags(post));
    });

    // Sync `<link rel="prev|next">` to the current post's series neighbours.
    // Tracks `series()` separately so the links update on slug navigation
    // and disappear (or shift) the moment the user moves through the series.
    effect(() => {
      const series = this.series();
      const slug = this.slug();
      untracked(() => this.blogSeo.updateSeriesLinkRels(slug, series));
    });

    // Re-apply post-render side effects (anchor href rewrite, lazy mermaid
    // diagrams) every time the rendered content swaps in. The effects only
    // do work once `postLayout()` has been written by the
    // `afterNextRender` callback below — that ordering is the reason
    // these are declared at construction time but read both signals.
    effect(() => {
      const layout = this.postLayout();
      this.content();
      if (!layout) return;
      untracked(() => this.rewriteAnchorHrefs(layout));
    });

    effect(() => {
      const layout = this.postLayout();
      this.content();
      if (!layout) return;
      untracked(() => this.mermaid.scheduleRender(layout));
    });

    /*
      Mermaid is initialised with the *current* theme scheme, so already-
      rendered SVGs keep their original palette after a theme toggle.
      Watch `ThemeService.theme` and re-render in place when the scheme
      flips — `revertIfRendered` rebuilds the source placeholders and
      `scheduleRender` re-runs the lazy import + render with the new
      palette baked in.
    */
    effect(() => {
      const themeName = this.theme.theme();
      const layout = this.postLayout();
      if (!layout) return;
      untracked(() => {
        if (this.mermaid.revertIfRendered(layout)) {
          this.mermaid.scheduleRender(layout);
        }
        // Reference `themeName` so the linter and future readers see why
        // this effect exists. The signal subscription is what wires it.
        void themeName;
      });
    });

    this.destroyRef.onDestroy(() => {
      this.blogSeo.clearSeriesLinkRels();
      // Drop any pending mermaid render so the root-scoped service
      // doesn't fire an idle callback against a detached `.post-layout`
      // subtree after we've torn down. The in-flight render itself
      // can't be aborted but its placeholder query short-circuits on
      // a detached root.
      this.mermaid.cancel();
    });

    afterNextRender(() => {
      // Publish browser-only environment flags now that we're past
      // hydration. SSG matched `false` for both; flipping here triggers
      // a clean post-hydration render of any conditional UI (Share
      // button, etc.) without the structural-mismatch warning that
      // a field-initialiser-based `typeof navigator` check produces.
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        this.canWebShare.set(true);
      }

      const root = this.elRef.nativeElement as HTMLElement;
      const postLayout = root.querySelector('.post-layout') as HTMLElement | null;
      if (!postLayout) return;
      // Publishing the layout reference triggers the two `effect()`s
      // declared above, which run their initial side-effect pass.
      this.postLayout.set(postLayout);

      // Pin the scroll source to the document root so the JS rAF
      // fallback path matches the CSS `animation-timeline: scroll(root)`
      // declaration in `styles.css`. The previous shape preferred
      // `<main class="content">` if it had scrollable overflow, then
      // fell through to the doc root — which works today (the column-
      // flex shell makes the document the actual scroller) but would
      // diverge from the CSS path if the layout ever switched `.content`
      // to a fixed-height scroll container, leaving Firefox + older
      // engines reporting a different progress fraction than every
      // other browser. Same target, same math, same result everywhere.
      const scroller =
        (document.scrollingElement as HTMLElement | null) ?? document.documentElement;

      // Skip the JS scroll listener entirely on browsers that support
      // CSS scroll-driven animations — the `.reading-progress` bar is then
      // animated via `animation-timeline: scroll(root)` on the compositor
      // (see styles.css), which is cheaper and always smooth.
      const cssScrollDriven =
        typeof CSS !== 'undefined' &&
        typeof CSS.supports === 'function' &&
        CSS.supports('animation-timeline: scroll()');

      if (!cssScrollDriven) {
        // rAF-throttle the progress recompute. Scroll fires faster than the
        // compositor frame on trackpads/wheels, so coalescing to one update
        // per animation frame keeps INP healthy without losing fidelity —
        // the eye can't perceive the bar moving more often than 60 Hz.
        let rafHandle = 0;
        let scheduled = false;
        const recompute = () => {
          scheduled = false;
          rafHandle = 0;
          const total = scroller.scrollHeight - scroller.clientHeight;
          if (total <= 0) {
            this.scrollProgress.set(100);
            return;
          }
          this.scrollProgress.set(Math.min(100, (scroller.scrollTop / total) * 100));
        };
        // The document root scroller fires scroll events on `window`,
        // not on `document.documentElement` — listening on the element
        // itself would never receive them. (When this branch supported
        // `.content` as a fallback scroller, the target was that
        // element directly; pinning to the doc root means `window`
        // is always correct.)
        const target: EventTarget = window;
        const onScroll = () => {
          if (scheduled) return;
          scheduled = true;
          rafHandle = requestAnimationFrame(recompute);
        };

        // `passive: true` lets the browser keep scroll on the compositor
        // thread; without it Chrome treats the listener as a potential
        // preventDefault() and synchronises scrolling with the main thread.
        target.addEventListener('scroll', onScroll, { passive: true });
        // Seed the bar so it reflects any initial scroll restoration
        // (e.g. browser back-forward navigation lands you mid-post).
        recompute();
        this.destroyRef.onDestroy(() => {
          target.removeEventListener('scroll', onScroll);
          if (rafHandle) cancelAnimationFrame(rafHandle);
        });
      }

      // One delegated click listener for every code-block "Copy" button and
      // every heading permalink anchor. The markup for both is generated by
      // MarkdownService — see the `code` and `heading` renderer overrides.
      const onClick = async (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        // 1. Heading permalink anchors. The renderer emits `href="#id"`
        //    plus `data-anchor-id="id"`; we hijack the click to update the
        //    URL bar without bouncing the reader to "/" via <base href>.
        const anchor = target.closest('.anchor[data-anchor-id]') as HTMLAnchorElement | null;
        if (anchor) {
          await this.handleAnchorClick(event, anchor);
          return;
        }

        // 2. Code-block "Copy" buttons.
        const button = target.closest('.copy-btn') as HTMLButtonElement | null;
        if (!button) return;
        const code = button.parentElement?.querySelector('code')?.textContent ?? '';
        const ok = await copyToClipboard(code);
        if (!ok) {
          this.toasts.push({
            title: 'Could not copy the snippet',
            detail: 'Your browser blocked clipboard access. Select the code manually instead.',
          });
          return;
        }
        // Mutate the inner `.copy-btn-label` span (which carries the
        // `aria-live="polite"` attribute) rather than the button's
        // own textContent. Live regions are most reliably announced
        // when the live element existed in the DOM *before* the
        // mutation and only its text node changes — toggling the
        // button's own text was being silently dropped by some
        // SR + browser combinations on touch devices.
        const label = button.querySelector<HTMLSpanElement>('.copy-btn-label');
        if (!label) return;
        const originalText = label.textContent;
        const originalLabel = button.getAttribute('aria-label');
        label.textContent = 'Copied!';
        button.setAttribute('aria-label', 'Code copied to clipboard');
        button.classList.add('copy-btn--copied');
        this.scheduleTimeout(() => {
          label.textContent = originalText;
          if (originalLabel !== null) button.setAttribute('aria-label', originalLabel);
          button.classList.remove('copy-btn--copied');
        }, 1500);
      };
      postLayout.addEventListener('click', onClick);
      this.destroyRef.onDestroy(() => postLayout.removeEventListener('click', onClick));
    });
  }

  /**
   * Rewrite every `[data-anchor-id]` permalink emitted by `MarkdownService`
   * so its `href` resolves against the current post URL instead of the
   * `<base href="/">` site root. Without this, clicking `<a href="#x">` on
   * a post would navigate the reader to `/#x` (the home route) and lose
   * their place. The data attribute is the stable identifier; the href
   * is purely cosmetic for "copy link as".
   */
  private rewriteAnchorHrefs(root: HTMLElement): void {
    const slug = this.slug();
    if (!slug) return;
    const base = `/blog/${slug}`;
    const anchors = root.querySelectorAll<HTMLAnchorElement>('.anchor[data-anchor-id]');
    anchors.forEach((a) => {
      const id = a.getAttribute('data-anchor-id') ?? '';
      if (!id) return;
      a.setAttribute('href', `${base}#${id}`);
    });
  }

  /**
   * Click handler for permalink anchors. Updates the URL hash via
   * `history.replaceState` (so back/forward isn't polluted), copies the
   * absolute URL to the clipboard, and pulses a toast to confirm the
   * copy succeeded. Modifier-clicks fall through to the browser so
   * "open in new tab" / "copy link" continue to work as expected.
   */
  private async handleAnchorClick(event: MouseEvent, anchor: HTMLAnchorElement): Promise<void> {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    const id = anchor.getAttribute('data-anchor-id') ?? '';
    const slug = this.slug();
    if (!id || !slug) return;
    const path = `/blog/${slug}#${id}`;
    // Guard `window.history` independently of `window` itself: the outer
    // `typeof window` check fails the SSR build, but exotic shells (e.g.
    // some embedded webviews) expose `window` without `history`.
    const history = typeof window !== 'undefined' ? window.history : undefined;
    if (history) {
      history.replaceState(history.state, '', path);
      const target = this.document.getElementById(id);
      if (target) {
        // `scrollIntoView({ behavior: 'smooth' })` is a JS-side option
        // and the browser honours it over the global `scroll-behavior:
        // auto` CSS rule that the reduced-motion `@media` block sets.
        // Check the preference at click time and pass `'instant'` to
        // skip the smooth-scroll animation for motion-sensitive users
        // (WCAG 2.3.3).
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? 'instant' : 'smooth',
          block: 'start',
        });
        // Move keyboard focus to the heading itself so the next Tab
        // continues from the section the reader just navigated to.
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
    if (await copyToClipboard(`${environment.siteUrl}${path}`)) {
      this.toasts.push({
        title: 'Section link copied',
        detail: 'A link to this section is now on your clipboard.',
      });
    }
  }

  /**
   * Cancellable `setTimeout` wrapper. The id is added to `timers` and
   * removed when the callback fires; the destroy hook above clears any
   * still-pending ids so we never run handlers on a torn-down view.
   * Use this in place of bare `setTimeout` for any fire-and-forget UI
   * reset (badge state, button label revert, etc.).
   */
  private scheduleTimeout(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }
}
