export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  readingTime: string;
  /**
   * Optional cover image (relative to siteUrl). Falls back to the generic
   * `/assets/images/og-image.png` when omitted. Used for `og:image` and
   * `twitter:image`.
   */
  cover?: string;
  /**
   * When true, the post is excluded from the sitemap, RSS feed, and the public
   * blog list. Still gets prerendered so the URL is reachable for review.
   */
  draft?: boolean;
}
