/**
 * Site-level structured data for the home page: `Organization` and `WebSite` in one graph. No
 * `SearchAction` (the site has no search) and no ratings or reviews. Single Spanish locale
 * (D-14), so no alternates.
 */

import { absoluteUrl, site } from "../../config/site.ts";

export function siteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: site.name,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/media/brand/pequeverso-og-1200x630.png"),
        sameAs: Object.values(site.social),
        email: site.supportEmail,
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: absoluteUrl("/"),
        name: site.name,
        inLanguage: "es",
        publisher: { "@id": absoluteUrl("/#organization") },
      },
    ],
  };
}
