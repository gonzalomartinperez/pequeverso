/**
 * Last review dates of the non-product indexable pages, the `lastModified` of their sitemap
 * entries (products carry `seo.lastReviewed` in the registry). Real dates, taken from git history
 * of the page's content sources: `git log -1 --format=%cs -- content/es/home.ts content/es/hub.ts`
 * and `-- content/es/soporte.ts`. Bump a date when the page content changes.
 */
export const pageReviewed = {
  home: "2026-11-14",
  support: "2026-11-14",
  /** Last accessibility review of /accesibilidad/; bump it when the statement or the checks it cites change. */
  accessibility: "2026-11-14",
} as const;
