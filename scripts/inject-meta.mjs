import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep, posix } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { siteUrl: SITE_URL, siteName: SITE_NAME } = require('../site.config.json');

const DIST = join(process.cwd(), 'dist/fluxus/browser');
const OG_IMAGE = `${SITE_URL}/assets/images/og-image.png`;

const blogManifest = JSON.parse(
  await readFile(join(process.cwd(), 'src/assets/blog/posts.json'), 'utf-8'),
);
const blogBySlug = new Map(blogManifest.map((p) => [p.slug, p]));

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

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escapeText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let routesProcessed = 0;
let blogProcessed = 0;

for await (const htmlPath of walk(DIST)) {
  let html = await readFile(htmlPath, 'utf-8');
  const route = deriveRoute(htmlPath);
  const url = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;

  const blogMatch = route.match(/^\/blog\/([^/]+)$/);
  if (blogMatch && blogBySlug.has(blogMatch[1])) {
    const post = blogBySlug.get(blogMatch[1]);
    const title = `${post.title} — ${SITE_NAME}`;
    html = setTitle(html, title);
    html = setMetaDescription(html, post.excerpt);
    html = setMetaProperty(html, 'og:title', title);
    html = setMetaProperty(html, 'og:description', post.excerpt);
    html = setMetaProperty(html, 'og:type', 'article');
    html = setMetaProperty(html, 'og:url', url);
    html = setMetaProperty(html, 'og:image', OG_IMAGE);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:title', title);
    html = setMetaProperty(html, 'twitter:description', post.excerpt);
    html = setMetaProperty(html, 'twitter:image', OG_IMAGE);
    html = setLinkCanonical(html, url);
    blogProcessed++;
    console.log(`  BLOG ${post.slug} → "${post.title}"`);
  } else {
    html = setMetaProperty(html, 'og:url', url);
    html = setMetaProperty(html, 'og:type', 'website');
    html = setMetaProperty(html, 'og:image', OG_IMAGE);
    html = setMetaProperty(html, 'og:site_name', SITE_NAME);
    html = setMetaProperty(html, 'twitter:card', 'summary_large_image');
    html = setMetaProperty(html, 'twitter:image', OG_IMAGE);
    html = setLinkCanonical(html, url);
    routesProcessed++;
    console.log(`  ROUTE ${route}`);
  }

  await writeFile(htmlPath, html, 'utf-8');
}

console.log(
  `\nInjected meta tags for ${routesProcessed} routes and ${blogProcessed} blog posts.`,
);
