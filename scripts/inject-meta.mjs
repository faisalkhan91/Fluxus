import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep, posix } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('../site.config.json');
const { siteUrl: SITE_URL, siteName: SITE_NAME } = config;
const TWITTER_HANDLE = (config.twitterHandle ?? '').trim();

const DIST = join(process.cwd(), 'dist/fluxus/browser');
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/images/og-image.png`;

function resolveCover(post) {
  // Author-supplied cover wins.
  if (post.cover) {
    if (post.cover.startsWith('http')) return post.cover;
    return `${SITE_URL}${post.cover.startsWith('/') ? '' : '/'}${post.cover}`;
  }
  // Otherwise rely on the auto-generated card from scripts/build-og-cards.mjs.
  return `${SITE_URL}/og/${post.slug}.png`;
}

const blogManifest = JSON.parse(
  await readFile(join(process.cwd(), 'src/assets/blog/posts.json'), 'utf-8'),
);
const blogBySlug = new Map(blogManifest.map((p) => [p.slug, p]));

// Tag slug helper (must match `slugify` in src/app/shared/utils/string.utils.ts).
function tagSlug(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Map of tag slug -> { label, posts: [] } across non-draft posts.
const tagsBySlug = new Map();
for (const post of blogManifest) {
  if (post.draft) continue;
  for (const tag of post.tags ?? []) {
    const slug = tagSlug(tag);
    if (!slug) continue;
    if (!tagsBySlug.has(slug)) tagsBySlug.set(slug, { label: tag, posts: [] });
    tagsBySlug.get(slug).posts.push(post);
  }
}

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) {
      yield* walk(full);
    } else if (name === 'index.html') {
      yield full;
    }
  }
}

function deriveRoute(htmlPath) {
  const rel = relative(DIST, htmlPath).split(sep).join(posix.sep);
  const dir = rel.replace(/\/?index\.html$/, '');
  return dir === '' ? '/' : `/${dir}`;
}

function setMetaProperty(html, property, content) {
  const safe = escapeAttr(content);
  const attr = property.startsWith('og:') ? 'property' : 'name';
  const re = new RegExp(`<meta\\s+${attr}=\"${property}\"[^>]*>`, 'i');
  const tag = `<meta ${attr}="${property}" content="${safe}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function setLinkCanonical(html, url) {
  const tag = `<link rel="canonical" href="${escapeAttr(url)}">`;
  return /<link\s+rel="canonical"[^>]*>/i.test(html)
    ? html.replace(/<link\s+rel="canonical"[^>]*>/i, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
}

function setTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeText(title)}</title>`);
}

function setMetaDescription(html, description) {
  const tag = `<meta name="description" content="${escapeAttr(description)}">`;
  return /<meta\s+name="description"[^>]*>/i.test(html)
    ? html.replace(/<meta\s+name="description"[^>]*>/i, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
}

/**
 * Strip any previously-injected per-route JSON-LD blocks (matched by id) and
 * append fresh ones. The site-wide JSON-LD authored in src/index.html is
 * untouched — it has no id attribute on its <script>.
 */
function setBlogJsonLd(html, post, url) {
  const cover = resolveCover(post);
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };
  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.title,
    description: post.excerpt,
    image: cover,
    url,
    keywords: (post.tags || []).join(', '),
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@id': `${SITE_URL}/#person` },
    publisher: { '@id': `${SITE_URL}/#person` },
    inLanguage: 'en',
  };
  const block =
    `    <script type="application/ld+json" data-blog-jsonld="${escapeAttr(post.slug)}">${JSON.stringify(blogPosting)}</script>\n` +
    `    <script type="application/ld+json" data-breadcrumb-jsonld="${escapeAttr(post.slug)}">${JSON.stringify(breadcrumb)}</script>\n`;
  // Remove any prior injected blocks from a previous run (idempotency).
  const stripped = html.replace(
    /\s*<script\s+type="application\/ld\+json"\s+data-(?:blog|breadcrumb)-jsonld="[^"]*">[\s\S]*?<\/script>/gi,
    '',
  );
  return stripped.replace('</head>', `${block}  </head>`);
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escapeText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Inject CollectionPage + BreadcrumbList JSON-LD for a /blog/tag/<slug> route.
 * Idempotent — strips any prior tag-archive blocks before re-emitting.
 */
function setTagJsonLd(html, slug, label, posts, url) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: `Tag: ${label}`, item: url },
    ],
  };
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Posts tagged "${label}"`,
    description: `Every post on Faisal Khan's blog tagged with "${label}".`,
    url,
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    hasPart: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.date,
    })),
  };
  const block =
    `    <script type="application/ld+json" data-tag-jsonld="${escapeAttr(slug)}">${JSON.stringify(collection)}</script>\n` +
    `    <script type="application/ld+json" data-tag-breadcrumb-jsonld="${escapeAttr(slug)}">${JSON.stringify(breadcrumb)}</script>\n`;
  const stripped = html.replace(
    /\s*<script\s+type="application\/ld\+json"\s+data-tag(?:-breadcrumb)?-jsonld="[^"]*">[\s\S]*?<\/script>/gi,
    '',
  );
  return stripped.replace('</head>', `${block}  </head>`);
}

let routesProcessed = 0;
let blogProcessed = 0;
let tagsProcessed = 0;

for await (const htmlPath of walk(DIST)) {
  let html = await readFile(htmlPath, 'utf-8');
  const route = deriveRoute(htmlPath);
  const url = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;

  const tagMatch = route.match(/^\/blog\/tag\/([^/]+)$/);
  const blogMatch = route.match(/^\/blog\/([^/]+)$/);

  if (tagMatch && tagsBySlug.has(tagMatch[1])) {
    const { label, posts } = tagsBySlug.get(tagMatch[1]);
    const title = `Posts tagged "${label}" — ${SITE_NAME}`;
    const description = `Every post on Faisal Khan's blog tagged with "${label}".`;
    html = setTitle(html, title);
    html = setMetaDescription(html, description);
    html = setMetaProperty(html, 'og:title', title);
    html = setMetaProperty(html, 'og:description', description);
    html = setMetaProperty(html, 'og:type', 'website');
    html = setMetaProperty(html, 'og:url', url);
    html = setMetaProperty(html, 'og:image', DEFAULT_OG_IMAGE);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:title', title);
    html = setMetaProperty(html, 'twitter:description', description);
    html = setMetaProperty(html, 'twitter:image', DEFAULT_OG_IMAGE);
    if (TWITTER_HANDLE) {
      html = setMetaProperty(html, 'twitter:site', TWITTER_HANDLE);
    }
    html = setLinkCanonical(html, url);
    html = setTagJsonLd(html, tagMatch[1], label, posts, url);
    tagsProcessed++;
    console.log(`  TAG  ${label} → ${posts.length} post(s)`);
    await writeFile(htmlPath, html, 'utf-8');
    continue;
  }

  if (blogMatch && blogBySlug.has(blogMatch[1])) {
    const post = blogBySlug.get(blogMatch[1]);
    const cover = resolveCover(post);
    const title = `${post.title} — ${SITE_NAME}`;
    html = setTitle(html, title);
    html = setMetaDescription(html, post.excerpt);
    html = setMetaProperty(html, 'og:title', title);
    html = setMetaProperty(html, 'og:description', post.excerpt);
    html = setMetaProperty(html, 'og:type', 'article');
    html = setMetaProperty(html, 'og:url', url);
    html = setMetaProperty(html, 'og:image', cover);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:title', title);
    html = setMetaProperty(html, 'twitter:description', post.excerpt);
    html = setMetaProperty(html, 'twitter:image', cover);
    if (TWITTER_HANDLE) {
      html = setMetaProperty(html, 'twitter:site', TWITTER_HANDLE);
      html = setMetaProperty(html, 'twitter:creator', TWITTER_HANDLE);
    }
    html = setLinkCanonical(html, url);
    html = setBlogJsonLd(html, post, url);
    blogProcessed++;
    console.log(`  BLOG ${post.slug} → "${post.title}"`);
  } else {
    html = setMetaProperty(html, 'og:url', url);
    html = setMetaProperty(html, 'og:type', 'website');
    html = setMetaProperty(html, 'og:image', DEFAULT_OG_IMAGE);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:image', DEFAULT_OG_IMAGE);
    if (TWITTER_HANDLE) {
      html = setMetaProperty(html, 'twitter:site', TWITTER_HANDLE);
    }
    html = setLinkCanonical(html, url);
    routesProcessed++;
    console.log(`  ROUTE ${route}`);
  }

  await writeFile(htmlPath, html, 'utf-8');
}

console.log(
  `\nInjected meta tags for ${routesProcessed} routes, ${blogProcessed} blog posts, and ${tagsProcessed} tag archives.`,
);
