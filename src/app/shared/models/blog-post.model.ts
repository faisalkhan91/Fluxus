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
  /**
   * Optional series the post belongs to (e.g. "Homelab"). Posts that share a
   * series render a small "Part N of M" banner with links to the other parts.
   */
  series?: string;
  /**
   * 1-based position within `series`. Required when `series` is set.
   */
  seriesOrder?: number;
  /**
   * Optional `YYYY-MM-DD` date for the most recent edit. When present and
   * different from `date`, the post page shows "Updated …" alongside the
   * publish date and the BlogPosting JSON-LD reports it as `dateModified`.
   */
  updated?: string;
}
