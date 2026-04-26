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
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { httpResource } from '@angular/common/http';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { GlassPanelComponent } from '@ui/glass-panel/glass-panel.component';
import { GlassCardComponent } from '@ui/glass-card/glass-card.component';
import { IconComponent } from '@ui/icon/icon.component';
import { TrustedHtmlPipe } from '@shared/pipes/trusted-html.pipe';
import { BlogService } from '@core/services/blog.service';
import { MarkdownService } from '@core/services/markdown.service';
import { ProfileDataService } from '@core/services/profile-data.service';
import { ErrorToastService } from '@core/services/error-toast.service';
import { ThemeService } from '@core/services/theme.service';
import { BlogPost } from '@shared/models/blog-post.model';
import { environment } from '@env/environment';
import { slugify } from '@shared/utils/string.utils';
import { formatPostDate } from '@shared/utils/blog.utils';
import { copyToClipboard } from '@shared/utils/clipboard.utils';
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
  private metaService = inject(Meta);
  private titleService = inject(Title);
  private document = inject(DOCUMENT);

  /**
   * Reference to the `.post-layout` wrapper, populated by the first
   * `afterNextRender` callback. The two side-effect handlers below
   * (anchor href rewrite + mermaid render) read this signal so they can
   * be declared at construction time as plain `effect()`s rather than
   * being nested inside the render callback. Hoisting the effects keeps
   * reactivity declarations co-located with the component's state and
   * makes the dependency graph easier to reason about.
   */
  private postLayout = signal<HTMLElement | null>(null);

  protected slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')), {
    initialValue: '',
  });

  // Reactive markdown body. Re-fires automatically when slug() changes and
  // resets to the empty default while loading — fixing the stale-content
  // flash that the previous subscribe-based pipeline had.
  private postBody = httpResource.text(
    () => {
      const slug = this.slug();
      return slug ? `assets/blog/posts/${slug}.md` : undefined;
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
  private readonly rendered = computed(() => {
    const raw = this.postBody.value();
    if (!raw) return { html: '', toc: [] };
    return this.md.renderWithToc(stripLeadingH1(raw));
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
    const url = encodeURIComponent(`${environment.siteUrl}/blog/${slug}`);
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
   * Share button only on platforms that support the Web Share API. Read
   * once at construction (the value never changes for the lifetime of the
   * tab) — wrapping it in `computed()` adds signal-graph overhead for a
   * static environment check. `navigator` is undefined under SSR, so the
   * button is omitted from the prerendered HTML and Angular hydrates it
   * on first paint without a layout shift (the share row is a flex
   * container with `flex-wrap`, so adding a button at the start doesn't
   * affect siblings).
   */
  readonly canWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

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
        url: `${environment.siteUrl}/blog/${slug}`,
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
    const url = `${environment.siteUrl}/blog/${slug}`;

    if (await copyToClipboard(url)) {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 1500);
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
    // Update <title> + meta tags as the post resolves.
    effect(() => {
      const post = this.meta();
      if (post) untracked(() => this.updateMetaTags(post));
    });

    // Sync `<link rel="prev|next">` to the current post's series neighbours.
    // Tracks `series()` separately so the links update on slug navigation
    // and disappear (or shift) the moment the user moves through the series.
    effect(() => {
      const series = this.series();
      const slug = this.slug();
      untracked(() => this.updateSeriesLinkRels(slug, series));
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
      untracked(() => this.scheduleMermaidRender(layout));
    });

    /*
      Mermaid is initialised with the *current* `data-theme` attribute,
      which means already-rendered SVGs keep their original palette after
      a theme toggle. Watch the `ThemeService.theme` signal and re-render
      the diagrams in place when the user flips themes — `revertMermaid`
      restores the original source placeholders (we stash the source as
      `data-mermaid-source` on the rendered figure for exactly this
      reason) and `scheduleMermaidRender` then re-runs the lazy import +
      render path with the new theme baked in.
    */
    effect(() => {
      const themeName = this.theme.theme();
      const layout = this.postLayout();
      if (!layout) return;
      untracked(() => {
        if (this.revertMermaidIfRendered(layout)) {
          this.scheduleMermaidRender(layout);
        }
        // Reference `themeName` so the linter and future readers see why
        // this effect exists. The signal subscription is what wires it.
        void themeName;
      });
    });

    this.destroyRef.onDestroy(() => {
      this.removeLinkRel('prev');
      this.removeLinkRel('next');
    });

    afterNextRender(() => {
      const root = this.elRef.nativeElement as HTMLElement;
      const postLayout = root.querySelector('.post-layout') as HTMLElement | null;
      if (!postLayout) return;
      // Publishing the layout reference triggers the two `effect()`s
      // declared above, which run their initial side-effect pass.
      this.postLayout.set(postLayout);

      // Pick the element that is _actually_ scrolling. The shell gives
      // `<main class="content">` `overflow-y: auto`, but the column-flex
      // layout (`:host { min-height: 100vh }` + children with `flex: 1`)
      // lets it grow with its content instead of constraining it — so
      // under normal post lengths the document root is what scrolls and
      // `.content` never fires a scroll event. We only treat `.content`
      // as the scroller if it actually has a scrollable overflow; otherwise
      // we fall through to the document root. The matching CSS path uses
      // `animation-timeline: scroll(root)` for the same reason.
      const contentEl = postLayout.closest('main.content') as HTMLElement | null;
      const docScroller =
        (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
      const scroller =
        contentEl && contentEl.scrollHeight - contentEl.clientHeight > 1 ? contentEl : docScroller;

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
        // When the document is the scroller, scroll events fire on `window`
        // (or `document`), not on `document.documentElement` — listening on
        // the element itself would never receive them.
        const target: EventTarget = scroller === docScroller ? window : scroller;
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
        const originalText = button.textContent;
        const originalLabel = button.getAttribute('aria-label');
        button.textContent = 'Copied!';
        button.setAttribute('aria-label', 'Code copied to clipboard');
        button.classList.add('copy-btn--copied');
        setTimeout(() => {
          button.textContent = originalText;
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
    if (typeof window !== 'undefined') {
      window.history.replaceState(window.history.state, '', path);
      const target = this.document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
   * Defer the actual mermaid render until the browser is idle. Falls back
   * to a 200 ms `setTimeout` on Safari (which still ships no
   * `requestIdleCallback`) so the import never blocks the first paint or
   * the first input.
   */
  private scheduleMermaidRender(root: HTMLElement): void {
    if (typeof window === 'undefined') return;
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    };
    const w = window as IdleWindow;
    const run = () => void this.renderMermaidIfNeeded(root);
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run, { timeout: 1500 });
    } else {
      setTimeout(run, 200);
    }
  }

  /**
   * Finds every `.mermaid-source` placeholder emitted by MarkdownService
   * and replaces it with rendered SVG via the mermaid lib. Lazy import +
   * one initialisation per page; no-ops on the server. The original
   * source is stashed on the rendered `<figure>` as
   * `data-mermaid-source` so a subsequent theme toggle can revert and
   * re-render with the new palette (see `revertMermaidIfRendered`).
   */
  private async renderMermaidIfNeeded(root: HTMLElement): Promise<void> {
    if (typeof window === 'undefined') return;
    const placeholders = Array.from(
      root.querySelectorAll<HTMLElement>('.mermaid-source[data-mermaid-source]'),
    );
    if (placeholders.length === 0) return;
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark',
        securityLevel: 'strict',
      });
      let id = 0;
      for (const node of placeholders) {
        const source = node.textContent ?? '';
        try {
          const { svg } = await mermaid.render(`mermaid-${Date.now()}-${id++}`, source);
          const wrapper = document.createElement('figure');
          wrapper.className = 'mermaid';
          wrapper.innerHTML = svg;
          // Preserve the source so theme toggles can re-render in place.
          wrapper.setAttribute('data-mermaid-source', source);
          node.replaceWith(wrapper);
        } catch {
          // On failure, leave the source visible so the reader can still see
          // the diagram intent (matches the no-JS prerender behaviour).
          node.removeAttribute('data-mermaid-source');
        }
      }
    } catch {
      // mermaid lib failed to load — leave placeholders intact.
    }
  }

  /**
   * Inverse of `renderMermaidIfNeeded`: walks every `<figure class="mermaid"
   * data-mermaid-source>` already in the DOM and rewrites it back to the
   * `<div class="mermaid-source">…source…</div>` placeholder shape that
   * `renderMermaidIfNeeded` knows how to consume. Returns `true` when
   * any nodes were reverted (so the caller knows whether to schedule a
   * re-render).
   */
  private revertMermaidIfRendered(root: HTMLElement): boolean {
    if (typeof document === 'undefined') return false;
    const rendered = Array.from(
      root.querySelectorAll<HTMLElement>('figure.mermaid[data-mermaid-source]'),
    );
    if (rendered.length === 0) return false;
    for (const figure of rendered) {
      const source = figure.getAttribute('data-mermaid-source') ?? '';
      const placeholder = document.createElement('div');
      placeholder.className = 'mermaid-source';
      placeholder.setAttribute('data-mermaid-source', '');
      placeholder.textContent = source;
      figure.replaceWith(placeholder);
    }
    return true;
  }

  /**
   * Mirror the post's series neighbours onto `<link rel="prev|next">` in
   * the document head. Search engines and reading-mode UIs use these
   * hints to stitch a multi-part article into a single logical document.
   * Renders nothing for one-off posts and clears stale entries the moment
   * the route changes.
   */
  private updateSeriesLinkRels(
    slug: string,
    series: { posts: BlogPost[]; index: number } | undefined,
  ): void {
    if (!slug || !series || series.posts.length < 2) {
      this.removeLinkRel('prev');
      this.removeLinkRel('next');
      return;
    }
    const prev = series.posts[series.index - 1];
    const next = series.posts[series.index + 1];
    this.setLinkRel('prev', prev ? `${environment.siteUrl}/blog/${prev.slug}` : null);
    this.setLinkRel('next', next ? `${environment.siteUrl}/blog/${next.slug}` : null);
  }

  /** Upsert a `<link rel="…">` entry, or remove it when `href` is null. */
  private setLinkRel(rel: 'prev' | 'next', href: string | null): void {
    if (!href) {
      this.removeLinkRel(rel);
      return;
    }
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      head.appendChild(link);
    }
    link.href = href;
  }

  private removeLinkRel(rel: 'prev' | 'next'): void {
    this.document.head.querySelector(`link[rel="${rel}"]`)?.remove();
  }

  private updateMetaTags(post: BlogPost): void {
    const url = `${environment.siteUrl}/blog/${post.slug}`;
    const title = `${post.title} - ${environment.siteName}`;
    const cover = post.cover
      ? post.cover.startsWith('http')
        ? post.cover
        : `${environment.siteUrl}${post.cover.startsWith('/') ? '' : '/'}${post.cover}`
      : `${environment.siteUrl}/og/${post.slug}.png`;

    this.titleService.setTitle(title);
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: post.excerpt });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:image', content: cover });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: post.excerpt });
    this.metaService.updateTag({ name: 'twitter:image', content: cover });
    this.metaService.updateTag({ name: 'description', content: post.excerpt });
  }
}
