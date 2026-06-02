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
    // The "Copied!" announcement target is an inner span, not the
    // button itself — VoiceOver on iOS drops `aria-live` on the
    // mutating element. Only the span's textContent toggles.
    expect(html).toContain('<span class="copy-btn-label" aria-live="polite">Copy</span>');
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
    // WARNING is one of the urgent kinds — role/aria-label coverage
    // lives in the dedicated specs below; this test just verifies
    // the parser plus the visible title + body shape.
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

  it('marks WARNING callouts as a labelled region (urgent landmark)', () => {
    const html = service.render('> [!WARNING] Watch out\n> Body.\n');
    expect(html).toContain('class="callout callout--warning"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Warning"');
  });

  it('marks CAUTION callouts as a labelled region', () => {
    const html = service.render('> [!CAUTION] Hot stove\n> Body.\n');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Caution"');
  });

  it('keeps NOTE / TIP / INFO callouts on role="note" (supplemental prose, no landmark)', () => {
    for (const kind of ['NOTE', 'TIP', 'INFO']) {
      const html = service.render(`> [!${kind}] Hi\n> Body.\n`);
      expect(html, `kind ${kind}`).toContain('role="note"');
      expect(html, `kind ${kind}`).not.toContain('aria-label=');
    }
  });

  it('escapes attributes safely (no script injection in href/title/alt)', () => {
    const html = service.render('![alt"x](javascript:alert(1) "title")');
    // alt and title attribute values are HTML-escaped — no raw quote breakout.
    expect(html).not.toContain('alt="alt"x"');
    expect(html).toContain('alt="alt&quot;x"');
  });

  describe('attribute-injection defence', () => {
    it('escapes a quote-breakout attempt in alt text so onerror= cannot land', () => {
      // The classic "break out of the alt attribute and inject an event
      // handler" payload. The escape pass turns the breakout `"` into
      // `&quot;`, which keeps the entire alt content inside its quoted
      // attribute value — `onerror` is now part of the alt text, not a
      // sibling attribute. The dangerous form is `onerror="alert` with
      // an unescaped opening quote; the safe form (which we DO want to
      // see) is `onerror=&quot;`.
      const html = service.render('![x" onerror="alert(1)](/img.png)');
      expect(html).not.toContain('onerror="alert');
      expect(html).toContain('&quot; onerror=&quot;alert(1)');
    });

    it('escapes <script> markup inside alt text so it never executes', () => {
      const html = service.render('![<script>alert(1)</script>](/img.png)');
      // The figcaption mirrors the alt text and must also be inert.
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('escapes a quote-breakout attempt in the title attribute', () => {
      const html = service.render('![alt](/img.png "t\\" onerror=\\"alert(1)")');
      // Same invariant as above — the dangerous shape is an unescaped
      // `onerror="...alert(...)`. The escaped form inside title="…"
      // is fine because the browser parses the attribute value as
      // text, not as further markup.
      expect(html).not.toContain('onerror="alert');
    });

    it('neutralises a javascript: href on a markdown link to # (covered) and never grows attribute injection', () => {
      // Composite payload: malicious href + alt-text quote breakout.
      const html = service.render('[click" onclick="alert(1)](javascript:alert(2))');
      expect(html).not.toContain('href="javascript:');
      expect(html).not.toContain('onclick="alert');
      // The text node inside the <a> still contains the literal text
      // (marked keeps the link text as-is); verify it's escaped, not
      // rendered as live attributes.
      expect(html).toContain('&quot; onclick=&quot;alert(1)');
    });

    it('escapes single quotes in attribute values too, defending against single-quote-delimited contexts', () => {
      // The escape helper covers `&`, `<`, `>`, `"`. Single quotes are
      // not escaped because the renderer only emits double-quoted
      // attributes. This spec is a regression guard: if someone ever
      // changes the renderer to emit `alt='...'`, this test should be
      // updated to assert single-quote escaping is added too.
      const html = service.render("![it's fine](/img.png)");
      expect(html).toContain('alt="it\'s fine"');
    });
  });

  describe('link href sanitisation', () => {
    it('neutralises javascript: hrefs to # so clicks are inert', () => {
      const html = service.render('[click](javascript:alert(1))');
      expect(html).not.toContain('href="javascript:');
      expect(html).toContain('href="#"');
    });

    it('neutralises data:, vbscript:, file: hrefs', () => {
      for (const href of [
        'data:text/html,<script>1</script>',
        'vbscript:msgbox',
        'file:///etc/passwd',
      ]) {
        const html = service.render(`[x](${href})`);
        expect(html, `href ${href}`).toContain('href="#"');
        expect(html, `href ${href}`).not.toContain(href.split(':')[0] + ':');
      }
    });

    it('passes http(s), mailto, tel through unchanged', () => {
      for (const href of [
        'https://example.com/x',
        'http://example.com',
        'mailto:a@b',
        'tel:+1234',
      ]) {
        const html = service.render(`[x](${href})`);
        expect(html, `href ${href}`).toContain(`href="${href}"`);
      }
    });

    it('preserves fragment and relative hrefs', () => {
      expect(service.render('[x](#section)')).toContain('href="#section"');
      expect(service.render('[x](/about)')).toContain('href="/about"');
      expect(service.render('[x](./post)')).toContain('href="./post"');
    });

    it('neutralises HTML-entity-obfuscated javascript: schemes (decode before scheme test)', () => {
      // A browser decodes character references and ignores control chars
      // while resolving an href's scheme, so these all execute as
      // `javascript:` unless the sanitizer normalises first. The literal-
      // letter scheme regex alone would wave them through as "relative".
      const payloads = [
        '[x](&#106;avascript:alert(1))', // decimal entity for 'j'
        '[x](&#x6a;avascript:alert(1))', // hex entity for 'j'
        '[x](java&#09;script:alert(1))', // TAB inside the scheme
        '[x](javascript&colon;alert(1))', // entity for the ':' itself
      ];
      for (const md of payloads) {
        const html = service.render(md);
        expect(html, md).toContain('href="#"');
        // The decoded scheme must not survive as a usable javascript: link.
        expect(html, md).not.toMatch(/href="[^"]*avascript:alert/i);
      }
    });

    it('still passes a legit https URL containing query-param ampersands', () => {
      const html = service.render('[x](https://example.com/s?a=1&b=2)');
      expect(html).toContain('href="https://example.com/s?a=1&b=2"');
    });
  });

  describe('heading id de-duplication', () => {
    it('suffixes duplicate heading slugs so every section is addressable', () => {
      const { html, toc } = service.renderWithToc('## Overview\n\nfoo\n\n## Overview\n\nbar');
      expect(html).toContain('id="overview"');
      expect(html).toContain('id="overview-1"');
      expect(toc.map((t) => t.id)).toEqual(['overview', 'overview-1']);
      // data-anchor-id must track the unique id, not collide.
      expect(html).toContain('data-anchor-id="overview-1"');
    });

    it('resets the slug counter between renders', () => {
      service.render('## Intro');
      const second = service.render('## Intro');
      // A fresh render starts the counter over — no leaked `-1` suffix.
      expect(second).toContain('id="intro"');
      expect(second).not.toContain('id="intro-1"');
    });
  });
});
