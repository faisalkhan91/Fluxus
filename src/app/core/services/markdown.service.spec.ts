import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MarkdownService } from './markdown.service';

/**
 * Locks down the renderer overrides in MarkdownService. These shape the
 * accessible / SEO / interactive surface of every blog post, so a regression
 * here would silently break things across the site.
 */
describe('MarkdownService renderer', () => {
  let service: MarkdownService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarkdownService);
  });

  it('emits headings with a stable slug id and a permalink anchor', () => {
    const html = service.render('## The Edge Appliance');
    expect(html).toContain('id="the-edge-appliance"');
    expect(html).toContain('class="anchor"');
    expect(html).toContain('data-anchor-id="the-edge-appliance"');
    // BlogPostComponent rewrites the bare fragment to the post URL and
    // intercepts clicks; the markdown renderer just emits the data hook.
    expect(html).toContain('href="#the-edge-appliance"');
    expect(html).toContain('aria-label="Permalink to The Edge Appliance"');
    // Heading text is preserved alongside the anchor.
    expect(html).toContain('The Edge Appliance</h2>');
  });

  it('renders the permalink affordance as an aria-hidden chain-link SVG, not a literal # glyph', () => {
    const html = service.render('## Section title');
    // The visible affordance must be an SVG, not a textual `#` glyph that
    // would inherit the heading's font-size and compete with the title.
    expect(html).toMatch(/<a class="anchor"[^>]*>\s*<svg\b/);
    // The SVG itself is decorative — the accessible name is on the anchor.
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    // Old `<span aria-hidden="true">#</span>` payload must be gone so the
    // hashtag can never resurface in another renderer pass.
    expect(html).not.toContain('<span aria-hidden="true">#</span>');
    // Sanity check that the anchor closes immediately after the SVG and
    // doesn't accidentally absorb the heading text.
    expect(html).toMatch(/<\/svg><\/a>/);
  });

  it('strips leading dashes from emoji-prefixed heading slugs', () => {
    const html = service.render('### ⚠️ The SMR Trap');
    expect(html).toContain('id="the-smr-trap"');
    expect(html).not.toContain('id="-the-smr-trap"');
    expect(html).toContain('data-anchor-id="the-smr-trap"');
  });

  it('omits the permalink anchor on h1 (post title) and h4+ (sub-sections)', () => {
    const h1 = service.render('# Top-level title');
    expect(h1).toContain('id="top-level-title"');
    expect(h1).not.toContain('class="anchor"');

    const h4 = service.render('#### Minor heading');
    expect(h4).toContain('id="minor-heading"');
    expect(h4).not.toContain('class="anchor"');
  });

  it('renders code fences with a copy button + hljs language class', () => {
    const html = service.render('```typescript\nconst x = 1;\n```');
    expect(html).toContain('<pre tabindex="0">');
    expect(html).toContain('class="copy-btn"');
    expect(html).toContain('aria-label="Copy code to clipboard"');
    expect(html).toContain('class="hljs language-typescript"');
  });

  it('emits literal hljs span markup for known languages, never escaped HTML', () => {
    // Regression: an earlier pairing of `markedHighlight` with the custom
    // `code` renderer caused highlight HTML to flow back through the renderer
    // and get re-escaped, surfacing as literal `<span class="hljs-keyword">`
    // text in posts. Lock the literal span markup down.
    const html = service.render('```typescript\nclass Foo {}\n```');
    expect(html).toContain('<span class="hljs-keyword">class</span>');
    expect(html).not.toContain('&lt;span class="hljs-keyword"');
    expect(html).not.toContain('&lt;span class=&quot;hljs-keyword');
  });

  it('keeps unknown languages safely escaped without an hljs class suffix', () => {
    const html = service.render('```\nplain text\n```');
    expect(html).toContain('class="hljs"');
    expect(html).toContain('plain text');
  });

  it('escapes raw HTML inside an unknown-language code fence', () => {
    // Without an explicit language we fall back to plain escaping (no hljs
    // pass), so user-authored angle brackets must still be safe.
    const html = service.render('```\n<script>alert(1)</script>\n```');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toMatch(/<script>alert\(1\)<\/script>/);
  });

  it('wraps images in a <figure> with the alt as a visible <figcaption>', () => {
    const html = service.render('![A hardware stack](assets/images/blog/foo.webp)');
    expect(html).toContain('<figure>');
    expect(html).toContain('<img src="assets/images/blog/foo.webp"');
    expect(html).toContain('alt="A hardware stack"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('<figcaption>A hardware stack</figcaption>');
  });

  it('falls back to a bare <img> when alt text is empty', () => {
    const html = service.render('![](assets/images/blog/foo.webp)');
    expect(html).not.toContain('<figure>');
    expect(html).not.toContain('<figcaption>');
    expect(html).toMatch(/<img\b[^>]*\salt=""/);
  });

  it('passes paragraphs and inline formatting through unchanged', () => {
    const html = service.render('Hello **world**, this is _Markdown_.');
    expect(html).toContain('<p>');
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('<em>Markdown</em>');
  });

  it('emits a placeholder for ```mermaid fences (rehydrated client-side)', () => {
    const html = service.render('```mermaid\ngraph LR\nA --> B\n```');
    expect(html).toContain('class="mermaid-source"');
    expect(html).toContain('data-mermaid-source');
    // Source stays visible inside the placeholder so the prerender / no-JS
    // view still conveys the diagram intent.
    expect(html).toContain('graph LR');
    // The mermaid placeholder skips the regular hljs/copy chrome.
    expect(html).not.toMatch(/<pre tabindex="0">[\s\S]*mermaid/);
  });

  it('renderWithToc captures every h2 + h3 in source order', () => {
    const md = '# Title\n\n## First\n\n### Sub\n\n## Second';
    const { html, toc } = service.renderWithToc(md);
    expect(html).toContain('<h1 id="title">');
    expect(toc).toEqual([
      { id: 'first', text: 'First', depth: 2 },
      { id: 'sub', text: 'Sub', depth: 3 },
      { id: 'second', text: 'Second', depth: 2 },
    ]);
  });

  it('parses GitHub-style callout admonitions', () => {
    const html = service.render(
      '> [!WARNING] The SMR Trap\n> SMR drives experience catastrophic IOPS degradation.\n',
    );
    expect(html).toContain('class="callout callout--warning"');
    expect(html).toContain('role="note"');
    expect(html).toContain('<p class="callout-title">The SMR Trap</p>');
    expect(html).toContain('SMR drives experience');
    // Plain blockquote without the marker still renders normally.
    const plain = service.render('> regular quote\n');
    expect(plain).toContain('<blockquote>');
    expect(plain).not.toContain('callout');
  });

  it('falls back to the kind label when callout title is omitted', () => {
    const html = service.render('> [!INFO]\n> Body only.\n');
    expect(html).toContain('class="callout callout--info"');
    expect(html).toContain('<p class="callout-title">Info</p>');
  });

  it('escapes attributes safely (no script injection in href/title/alt)', () => {
    const html = service.render('![alt"x](javascript:alert(1) "title")');
    // alt and title attribute values are HTML-escaped — no raw quote breakout.
    expect(html).not.toContain('alt="alt"x"');
    expect(html).toContain('alt="alt&quot;x"');
  });
});
