import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist/fluxus/browser');
const SITE_URL = 'https://faisalkhan.dpdns.org';
const SITE_NAME = 'Faisal Khan | Senior Software Engineer';

const raw = await readFile(join(process.cwd(), 'src/assets/blog/posts.json'), 'utf-8');
const posts = JSON.parse(raw);

for (const post of posts) {
  const htmlPath = join(DIST, 'blog', post.slug, 'index.html');
  let html;
  try {
    html = await readFile(htmlPath, 'utf-8');
  } catch {
    console.warn(`  SKIP ${post.slug} (no prerendered file)`);
    continue;
  }

  const title = `${post.title} — ${SITE_NAME}`;
  const url = `${SITE_URL}/blog/${post.slug}`;

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}">`)
    .replace(
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${post.excerpt}">`,
    )
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}">`)
    .replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="article">`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}">`)
    .replace(
      /<meta name="twitter:description"[^>]*>/,
      `<meta name="twitter:description" content="${post.excerpt}">`,
    )
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${post.excerpt}">`,
    )
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}">`);

  await writeFile(htmlPath, html, 'utf-8');
  console.log(`  OK ${post.slug} → "${post.title}"`);
}

console.log(`\nInjected meta tags for ${posts.length} blog posts.`);
