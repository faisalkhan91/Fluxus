import { environment } from '@env/environment';

/**
 * Site-absolute URL builders for the four route families that surface
 * full URLs (canonicals, og:url, JSON-LD `@id`, atom feed entry links,
 * sitemap entries, share links). Centralising the shapes here means a
 * future trailing-slash policy change or an environment.siteUrl swap
 * is a one-place edit instead of a 10-place migration.
 *
 * SSG-only: every consumer reads `environment.siteUrl` already, so the
 * helpers don't take an explicit base — they read the same global
 * environment.
 */

/** `<siteUrl>/blog/<slug>` — canonical URL for a blog post. */
export function blogPostUrl(slug: string): string {
  return `${environment.siteUrl}/blog/${slug}`;
}

/** `<siteUrl>/blog/tag/<slug>` — canonical URL for a blog-tag archive. */
export function blogTagUrl(slug: string): string {
  return `${environment.siteUrl}/blog/tag/${slug}`;
}

/** `<siteUrl>/projects/<slug>` — canonical URL for a project detail page. */
export function projectUrl(slug: string): string {
  return `${environment.siteUrl}/projects/${slug}`;
}

/** `<siteUrl>/projects/tag/<slug>` — canonical URL for a project-tag archive. */
export function projectTagUrl(slug: string): string {
  return `${environment.siteUrl}/projects/tag/${slug}`;
}
