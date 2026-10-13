import { site } from "@config/site";
import { homeCopy as copy } from "@content/es/home";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { ClosingBand } from "@/features/home/closing-band";
import { FeedingChapter } from "@/features/home/feeding-chapter";
import { HomeFaq } from "@/features/home/home-faq";
import { HomeHero } from "@/features/home/home-hero";
import { HubSticky } from "@/features/home/hub-sticky";
import { ReadingChapter } from "@/features/home/reading-chapter";
import { TrustStrip } from "@/features/home/trust-strip";
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
 * The hub of two products with the same weight from the hero to the close
 * (docs/specs/home-hub.md): the need selector with two doors (`#elige`), the shared trust strip,
 * the reading chapter (`#leer`), the first-meals chapter (`#bebe`), the FAQ by product
 * (`#preguntas`) and the close with both doors. The header carries the «Productos» menu instead of
 * a single-product CTA; below lg a contextual sticky bar follows the chapter in view. Coral never
 * appears here: the kit is bought on its landing, the course on Hotmart through the affiliate link.
 */
export default function HomePage() {
  return (
    <PageShell overlay nav={copy.nav} products>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from config
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomeHero />
      <TrustStrip />
      <ReadingChapter />
      <FeedingChapter />
      <HomeFaq />
      <ClosingBand />
      <HubSticky />
    </PageShell>
  );
}
