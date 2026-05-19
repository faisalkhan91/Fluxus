#!/usr/bin/env node
/**
 * Walks every `dist/fluxus/browser/**\/index.html` produced by the
 * Angular SSG prerender and rewrites the per-route head metadata
 * inline. The Angular shell can't author route-aware OG / Twitter /
 * canonical / JSON-LD tags at prerender time without per-component
 * coupling; this script is the single owner of that surface.
 *
 * Five branches keyed off the URL shape, each writing the same five
 * head primitives (title, meta description, OG tags, Twitter Card
 * tags, canonical link) plus a JSON-LD block:
 *
 *   /projects/<slug>             → Project article schema
 *   /projects/tag/<slug>         → CollectionPage with project list
 *   /blog/tag/<slug>             → CollectionPage with post list
 *   /blog/<slug>                 → BlogPosting + BreadcrumbList
 *   everything else (/, /about,  → website-type generic tags only
 *    /experience, /skills, …)
 *
 * Crawler signal:
 *   - Default OG image dimensions (1200x630 PNG) emitted whenever the
 *     image is the build-time default or auto-generated /og/<slug>.png
 *     so unfurl tools (Slack, iMessage, LinkedIn) skip the probe-fetch.
 *   - Drafts and future-dated posts get `<meta name="robots"
 *     content="noindex,nofollow">` so a guessed-URL crawl doesn't
 *     index unpublished content. The runtime `BlogPostSeoService`
 *     mirrors this predicate for SPA navigation.
 *
 * Build-chain position: runs after `ng build --configuration
 * production` and before `build-sitemap.mjs` / `build-feed.mjs` /
 * `build-og-cards.mjs`. Sources `site.config.json` for SITE_URL /
 * SITE_NAME / TWITTER_HANDLE so a fork only needs to update one file
 * to retarget the script suite.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep, posix } from 'node:path';
import { createRequire } from 'node:module';
import { loadProjectTagSlugs, loadProjectEntries, slugify } from './lib/projects.mjs';

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

// Map of tag slug -> { label, posts: [] } across published posts (non-draft
// AND publish date today-or-earlier). Future-dated posts are excluded so the
// CollectionPage JSON-LD and tag-page <head> metadata stay aligned with the
// prerender list in app.routes.server.ts and the sitemap/feed.
const todayYmd = new Date().toISOString().slice(0, 10);
const tagsBySlug = new Map();
for (const post of blogManifest) {
  if (post.draft) continue;
  if (post.date > todayYmd) continue;
  for (const tag of post.tags ?? []) {
    const slug = slugify(tag);
    if (!slug) continue;
    if (!tagsBySlug.has(slug)) tagsBySlug.set(slug, { label: tag, posts: [] });
    tagsBySlug.get(slug).posts.push(post);
  }
}

// Same shape as `tagsBySlug`, but for `/projects/tag/:tag`. Source of truth
// is `projects-data.service.ts` (regex-extracted via the shared loader so
// scripts and the prerender route generator stay aligned).
const projectTagsBySlug = new Map();
for (const entry of await loadProjectTagSlugs()) {
  projectTagsBySlug.set(entry.slug, { label: entry.label });
}

// `/projects/:slug` detail pages — shares most of the meta shape with
// blog posts (title, description, og:article, canonical) but without
// a generated OG card (we use the project's screenshot directly). The
// generated JSON already carries merged GitHub metadata (incl. the
// README excerpt when present), so we consume it directly rather than
// re-reading the raw fetch cache.
const projectsBySlug = new Map();
const GENERATED_PROJECTS_JSON = join(process.cwd(), 'src/app/core/data/projects.generated.json');
let generatedProjects = [];
try {
  const raw = JSON.parse(await readFile(GENERATED_PROJECTS_JSON, 'utf-8'));
  if (Array.isArray(raw)) generatedProjects = raw;
} catch {
  // File missing — `loadProjectEntries()` below will surface the error.
}
const githubBySlug = new Map();
for (const p of generatedProjects) {
  if (p?.slug) githubBySlug.set(p.slug, p.github ?? null);
}
for (const entry of await loadProjectEntries()) {
  const gh = githubBySlug.get(entry.titleSlug) ?? null;
  projectsBySlug.set(entry.titleSlug, {
    title: entry.title,
    description: entry.description,
    image: entry.image,
    link: entry.link,
    readmeExcerpt: gh?.readmeExcerpt ?? null,
  });
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
 * Upsert `<meta name="robots" content="...">`. Used to mark draft and
 * future-dated blog posts as `noindex,nofollow` so a direct-URL crawl
 * (Googlebot, archive.org, etc.) doesn't surface unpublished content.
 * Drafts are excluded from sitemap and feed already, but the
 * prerendered HTML is still on disk + served at its canonical URL —
 * a `noindex` meta is the only thing that tells crawlers to skip it.
 */
function setMetaRobots(html, content) {
  const tag = `<meta name="robots" content="${escapeAttr(content)}">`;
  return /<meta\s+name="robots"[^>]*>/i.test(html)
    ? html.replace(/<meta\s+name="robots"[^>]*>/i, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
}

/**
 * Append the canonical OG image dimensions (1200x630, PNG). Slack /
 * iMessage / LinkedIn unfurls render faster when the image type and
 * dimensions are pre-declared — without these, the crawler has to
 * fetch and probe the image before rendering the unfurl card.
 *
 * Only called at sites where the OG image is the build-time default
 * (or the auto-generated `/og/<slug>.png` for cover-less blog posts),
 * both of which are 1200x630 PNG by construction. Sites with a
 * post-supplied `cover` field skip this — dimensions vary and the
 * crawler probe-fetch is the safer path than a wrong declaration.
 */
function setDefaultOgImageDimensions(html) {
  return setMetaProperty(
    setMetaProperty(setMetaProperty(html, 'og:image:width', '1200'), 'og:image:height', '630'),
    'og:image:type',
    'image/png',
  );
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
    // articleSection mirrors the post's tags so Google can group
    // related articles by topic in Discover-style surfaces. wordCount
    // is sourced from posts.json (written by sync-reading-times.mjs)
    // so JSON-LD doesn't re-tokenise the markdown — single source of
    // truth, no drift.
    articleSection: post.tags || [],
    ...(typeof post.wordCount === 'number' ? { wordCount: post.wordCount } : {}),
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
 * Inject Article + BreadcrumbList JSON-LD for a /projects/<slug> detail
 * page. The header docstring promises "Project article schema" but the
 * implementation lived only in the OG / Twitter side until now — without
 * the JSON-LD block, project pages emitted no rich-snippet hints to
 * crawlers and Google's structured-data inspector returned "no items"
 * for this surface.
 *
 * `Article` is the closest schema.org match for a portfolio project
 * detail (no first-class `Project` type). The author + publisher both
 * fold back into the site-wide `Person` `@id` so the graph stays
 * consistent across blog posts, tags, and projects. Idempotent — uses
 * a `data-project-detail-jsonld` namespace so a re-run strips and
 * re-emits cleanly without colliding with blog or tag blocks.
 */
function setProjectJsonLd(html, slug, projectTitle, description, imageUrl, url) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE_URL}/projects` },
      { '@type': 'ListItem', position: 3, name: projectTitle, item: url },
    ],
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: projectTitle,
    description,
    image: imageUrl,
    url,
    author: { '@id': `${SITE_URL}/#person` },
    publisher: { '@id': `${SITE_URL}/#person` },
    inLanguage: 'en',
  };
  const block =
    `    <script type="application/ld+json" data-project-detail-jsonld="${escapeAttr(slug)}">${JSON.stringify(article)}</script>\n` +
    `    <script type="application/ld+json" data-project-detail-breadcrumb-jsonld="${escapeAttr(slug)}">${JSON.stringify(breadcrumb)}</script>\n`;
  const stripped = html.replace(
    /\s*<script\s+type="application\/ld\+json"\s+data-project-detail(?:-breadcrumb)?-jsonld="[^"]*">[\s\S]*?<\/script>/gi,
    '',
  );
  return stripped.replace('</head>', `${block}  </head>`);
}

/**
 * Inject CollectionPage + BreadcrumbList JSON-LD for a /projects/tag/<slug>
 * route. Mirrors `setTagJsonLd` shape exactly so crawlers see the same
 * structured-data contract whether they land on a blog tag or a project
 * tag page. Idempotent — uses a different `data-` attribute namespace
 * so it doesn't clobber the blog block when both run on the same HTML.
 */
function setProjectTagJsonLd(html, slug, label, url) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Projects', item: `${SITE_URL}/projects` },
      { '@type': 'ListItem', position: 3, name: `Tag: ${label}`, item: url },
    ],
  };
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Projects tagged "${label}"`,
    description: `Every project in Faisal Khan's portfolio tagged with "${label}".`,
    url,
    inLanguage: 'en',
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
  const block =
    `    <script type="application/ld+json" data-project-tag-jsonld="${escapeAttr(slug)}">${JSON.stringify(collection)}</script>\n` +
    `    <script type="application/ld+json" data-project-tag-breadcrumb-jsonld="${escapeAttr(slug)}">${JSON.stringify(breadcrumb)}</script>\n`;
  const stripped = html.replace(
    /\s*<script\s+type="application\/ld\+json"\s+data-project-tag(?:-breadcrumb)?-jsonld="[^"]*">[\s\S]*?<\/script>/gi,
    '',
  );
  return stripped.replace('</head>', `${block}  </head>`);
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
let projectTagsProcessed = 0;
let projectDetailsProcessed = 0;

for await (const htmlPath of walk(DIST)) {
  let html = await readFile(htmlPath, 'utf-8');
  const route = deriveRoute(htmlPath);
  const url = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;

  // og:locale is invariant across every prerendered route — the site is
  // English-only — so set it once at the top of the per-file pass
  // instead of scattering identical setMetaProperty calls across each
  // of the five branches below. en_US is the conventional default and
  // matches the Person schema's `inLanguage: 'en'` graph.
  html = setMetaProperty(html, 'og:locale', 'en_US');

  const tagMatch = route.match(/^\/blog\/tag\/([^/]+)$/);
  const projectTagMatch = route.match(/^\/projects\/tag\/([^/]+)$/);
  const blogMatch = route.match(/^\/blog\/([^/]+)$/);
  const projectDetailMatch = route.match(/^\/projects\/([^/]+)$/);

  // Detail page check runs *before* the tag check because both routes
  // match `/projects/<something>`. Detail matches only when the slug
  // corresponds to a known project; tag archives handle the `/tag/<x>`
  // shape via their own regex branch above.
  if (projectDetailMatch && !projectTagMatch && projectsBySlug.has(projectDetailMatch[1])) {
    const {
      title: projectTitle,
      description,
      image,
      readmeExcerpt,
    } = projectsBySlug.get(projectDetailMatch[1]);
    const title = `${projectTitle} — ${SITE_NAME}`;
    // README excerpt (when present) reads like an article abstract; the
    // curated `description` is the backup because nothing rules out a
    // project with no README.
    const metaDescription = readmeExcerpt?.trim() || description;
    const imageUrl = image
      ? `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`
      : DEFAULT_OG_IMAGE;
    html = setTitle(html, title);
    html = setMetaDescription(html, metaDescription);
    html = setMetaProperty(html, 'og:title', title);
    html = setMetaProperty(html, 'og:description', metaDescription);
    html = setMetaProperty(html, 'og:type', 'article');
    html = setMetaProperty(html, 'og:url', url);
    html = setMetaProperty(html, 'og:image', imageUrl);
    if (!image) html = setDefaultOgImageDimensions(html);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:title', title);
    html = setMetaProperty(html, 'twitter:description', metaDescription);
    html = setMetaProperty(html, 'twitter:image', imageUrl);
    html = setMetaProperty(html, 'twitter:image:alt', `${projectTitle} — project screenshot`);
    if (TWITTER_HANDLE) {
      html = setMetaProperty(html, 'twitter:site', TWITTER_HANDLE);
      html = setMetaProperty(html, 'twitter:creator', TWITTER_HANDLE);
    }
    html = setLinkCanonical(html, url);
    html = setProjectJsonLd(
      html,
      projectDetailMatch[1],
      projectTitle,
      metaDescription,
      imageUrl,
      url,
    );
    projectDetailsProcessed++;
    console.log(`  PROJ ${projectDetailMatch[1]} → "${projectTitle}"`);
    await writeFile(htmlPath, html, 'utf-8');
    continue;
  }

  if (projectTagMatch && projectTagsBySlug.has(projectTagMatch[1])) {
    const { label } = projectTagsBySlug.get(projectTagMatch[1]);
    const title = `Projects tagged "${label}" — ${SITE_NAME}`;
    const description = `Every project in Faisal Khan's portfolio tagged with "${label}".`;
    html = setTitle(html, title);
    html = setMetaDescription(html, description);
    html = setMetaProperty(html, 'og:title', title);
    html = setMetaProperty(html, 'og:description', description);
    html = setMetaProperty(html, 'og:type', 'website');
    html = setMetaProperty(html, 'og:url', url);
    html = setMetaProperty(html, 'og:image', DEFAULT_OG_IMAGE);
    html = setDefaultOgImageDimensions(html);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:title', title);
    html = setMetaProperty(html, 'twitter:description', description);
    html = setMetaProperty(html, 'twitter:image', DEFAULT_OG_IMAGE);
    html = setMetaProperty(html, 'twitter:image:alt', `${SITE_NAME} — portfolio social card`);
    if (TWITTER_HANDLE) {
      html = setMetaProperty(html, 'twitter:site', TWITTER_HANDLE);
    }
    html = setLinkCanonical(html, url);
    html = setProjectTagJsonLd(html, projectTagMatch[1], label, url);
    projectTagsProcessed++;
    console.log(`  PTAG ${label}`);
    await writeFile(htmlPath, html, 'utf-8');
    continue;
  }

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
    html = setDefaultOgImageDimensions(html);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:title', title);
    html = setMetaProperty(html, 'twitter:description', description);
    html = setMetaProperty(html, 'twitter:image', DEFAULT_OG_IMAGE);
    html = setMetaProperty(html, 'twitter:image:alt', `${SITE_NAME} — portfolio social card`);
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
    // Drafts and future-dated posts are still prerendered at their
    // /blog/<slug> URL so the author can review them, but they need to
    // be invisible to crawlers — sitemap + feed already exclude them.
    // Robots meta is the missing piece; without it, Googlebot can index
    // a guessed URL and the JSON-LD BlogPosting block makes the page
    // look fully published.
    const isHidden = post.draft === true || post.date > todayYmd;
    html = setTitle(html, title);
    html = setMetaDescription(html, post.excerpt);
    if (isHidden) {
      html = setMetaRobots(html, 'noindex,nofollow');
    }
    html = setMetaProperty(html, 'og:title', title);
    html = setMetaProperty(html, 'og:description', post.excerpt);
    html = setMetaProperty(html, 'og:type', 'article');
    html = setMetaProperty(html, 'og:url', url);
    html = setMetaProperty(html, 'og:image', cover);
    // Posts without an explicit `cover` field fall back to the
    // generated /og/<slug>.png card, which is always 1200x630 PNG.
    // Posts with a custom cover have variable dimensions; let the
    // crawler probe-fetch those.
    if (!post.cover) html = setDefaultOgImageDimensions(html);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:title', title);
    html = setMetaProperty(html, 'twitter:description', post.excerpt);
    html = setMetaProperty(html, 'twitter:image', cover);
    html = setMetaProperty(html, 'twitter:image:alt', `${post.title} — blog post cover`);
    if (TWITTER_HANDLE) {
      html = setMetaProperty(html, 'twitter:site', TWITTER_HANDLE);
      html = setMetaProperty(html, 'twitter:creator', TWITTER_HANDLE);
    }
    html = setLinkCanonical(html, url);
    // Skip BlogPosting JSON-LD for hidden posts — the structured-data
    // signal is the most aggressive index hint we emit, and it'd be
    // counterproductive on a page we just told crawlers to skip.
    if (!isHidden) {
      html = setBlogJsonLd(html, post, url);
    }
    blogProcessed++;
    console.log(`  BLOG ${post.slug}${isHidden ? ' [hidden]' : ''} → "${post.title}"`);
  } else {
    html = setMetaProperty(html, 'og:url', url);
    html = setMetaProperty(html, 'og:type', 'website');
    html = setMetaProperty(html, 'og:image', DEFAULT_OG_IMAGE);
    html = setDefaultOgImageDimensions(html);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:image', DEFAULT_OG_IMAGE);
    html = setMetaProperty(html, 'twitter:image:alt', `${SITE_NAME} — portfolio social card`);
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
  `\nInjected meta tags for ${routesProcessed} routes, ${blogProcessed} blog posts, ${tagsProcessed} blog-tag archives, ${projectTagsProcessed} project-tag archives, and ${projectDetailsProcessed} project detail pages.`,
);
