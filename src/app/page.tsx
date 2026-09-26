import { site } from "@config/site";
import { homeCopy as copy } from "@content/es/home";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { BenefitsStrip } from "@/features/home/benefits-strip";
import { ClosingBand } from "@/features/home/closing-band";
import { CollectionBento } from "@/features/home/collection-bento";
import { FeaturedProduct } from "@/features/home/featured-product";
import { HomeHero } from "@/features/home/home-hero";
import { LINK_HEADER, ProductLink } from "@/features/home/home-ui";
import { LifestyleBand } from "@/features/home/lifestyle-band";
import { MethodBand } from "@/features/home/method-band";
import { PagesShowcase } from "@/features/home/pages-showcase";
import { ValuesBento } from "@/features/home/values-bento";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/",
  title: copy.meta.title,
  description: copy.meta.description,
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: `${site.url}/`,
      logo: `${site.url}/media/brand/pequeverso-og-1200x630.png`,
      sameAs: Object.values(site.social),
      email: site.supportEmail,
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: `${site.url}/`,
      name: site.name,
      inLanguage: "es",
      publisher: { "@id": `${site.url}/#organization` },
    },
  ],
};

/**
 * Hub, laid out as a storefront under the "pequeño universo": the light-sky hero with the family
 * on a navy planet, the featured product card, purchase benefits, the collection inside the kit,
 * a lifestyle banner, real pages, how it works (with the syllable playground), what to expect and
 * the navy close. Every product link is a navy/white `ProductInterestLink` (never the coral CTA):
 * positions header, hero, hero-card, start, preview, closing.
 */
export default function HomePage() {
  return (
    <PageShell
      overlay
      nav={copy.nav}
      cta={
        <ProductLink position="header" className={LINK_HEADER}>
          {copy.hero.cta}
        </ProductLink>
      }
    >
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from config
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomeHero />
      <FeaturedProduct />
      <BenefitsStrip />
      <CollectionBento />
      <LifestyleBand />
      <PagesShowcase />
      <MethodBand />
      <ValuesBento />
      <ClosingBand />
    </PageShell>
  );
}
