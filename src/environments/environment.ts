import siteConfig from '../../site.config.json';

export const environment = {
  production: false,
  // Single source of truth: site.config.json (also read by the build/audit
  // scripts via scripts/lib/config.mjs) so SPA + prerender canonical URLs and
  // the title suffix can't drift across the runtime and the build pipeline.
  siteUrl: siteConfig.siteUrl,
  siteName: siteConfig.siteName,
  /**
   * Optional Sentry DSN. When non-empty AND production, AppErrorHandler will
   * lazy-load `@sentry/browser` and forward errors. Install the dep yourself
   * (`npm i @sentry/browser`) before setting a DSN.
   */
  sentryDsn: '',
};
