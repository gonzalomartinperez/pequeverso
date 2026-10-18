import { formatUsd } from "@config/commerce.ts";
import type { OfferProduct } from "@config/products/schema.ts";
import { Suspense } from "react";
import { DecisionLink } from "@/features/commerce/presentation/decision-link.tsx";
import { OfferModeMirror } from "@/features/commerce/presentation/offer-mode-mirror.tsx";
import { OfferModeRoot } from "@/features/commerce/presentation/offer-mode-root.tsx";
import { StickyCTA } from "@/features/commerce/presentation/sticky-cta.tsx";
import { PageWall } from "@/features/gallery/presentation/page-wall.tsx";
import { FAQ } from "@/shared/editorial/faq.tsx";
import { Topbar } from "@/shared/editorial/topbar.tsx";
import { MediaImage } from "@/shared/media/media-image.tsx";
import { PageMotion } from "@/shell/page-motion.tsx";
import { Footer } from "@/shell/site-footer.tsx";
import { Header } from "@/shell/site-header.tsx";
import { WithdrawalStrip } from "@/shell/withdrawal-strip.tsx";
import { CloseSection } from "./offer/close-section";
import { ComplementSection } from "./offer/complement-section";
import { DecisionBand } from "./offer/decision-band";
import { DownsellHero } from "./offer/downsell-hero";
import { MomentsBento } from "./offer/moments-bento";
import { ResourceBento } from "./offer/resource-bento";
import { AccentText, Kicker } from "./offer/ui";
import { type CounterFact, UpsellHero } from "./offer/upsell-hero";

type Props = { product: OfferProduct };

const STICKY_HIDE_OVER = ["#hero", "#hero-downsell", "#gfp-decision", "#cierre", "footer"];

function counterFacts({ composition, copy, resources }: OfferProduct): CounterFact[] {
  const units = copy.counters;
  if (!units) return [];
  return [
    { value: composition.pdfCount, unit: units.pdf },
    { value: composition.pageCount, unit: units.pages },
    { value: composition.visibleResources ?? resources.length, unit: units.resources },
  ];
}

/** Centered section heading of the offer page (kicker pill, accent title, optional lead). */
function Heading({
  id,
  kicker,
  title,
  lead,
}: {
  id: string;
  kicker: string;
  title: string;
  lead?: string | undefined;
}) {
  return (
    <header className="mx-auto mb-10 grid max-w-[46rem] justify-items-center gap-4 text-center md:mb-14">
      <Kicker>{kicker}</Kicker>
      <h2 id={id}>
        <AccentText text={title} />
      </h2>
      {lead ? <p className="lead text-pretty">{lead}</p> : null}
    </header>
  );
}

/**
 * Post-purchase offer. Both views are in the HTML; OfferModeRoot picks one before first
 * paint from ?downsell=1 (alias ?offer=downsell). The Hotmart sales-funnel widget is the
 * only decision control and is rendered exactly once, outside both views (DecisionBand).
 */
export function OfferLanding({ product }: Props) {
  const { copy, media, pricing } = product;
  const momentPage = media.pageIds[4] ?? media.pageIds[0] ?? media.hero;
  return (
    <>
      <WithdrawalStrip />
      <Topbar tone="mint">
        <span>{copy.topbar}</span>
      </Topbar>
      <Header
        cta={<DecisionLink size="sm">{copy.header.cta}</DecisionLink>}
        subtitle={copy.header.subtitle}
        overlay
      />
      <OfferModeRoot>
        <Suspense fallback={null}>
          <OfferModeMirror product={product.slug} prices={pricing} />
        </Suspense>
        <PageMotion>
          <UpsellHero product={product} counters={counterFacts(product)} />
          <DownsellHero product={product} />
          <DecisionBand product={product} />
          <ComplementSection copy={copy.complement} />

          <section
            id="incluye"
            data-slot="section"
            data-tone="aurora-sky"
            aria-labelledby="incluye-title"
            className="aurora-sky defer-render relative section-pad"
          >
            <div className="page-container">
              <Heading
                id="incluye-title"
                kicker={copy.included.kicker}
                title={copy.included.title}
                lead={copy.included.lead}
              />
              <ResourceBento resources={product.resources} total={copy.included.total} />
            </div>
          </section>

          <section
            id="paginas"
            data-slot="section"
            data-tone="aurora-blue"
            aria-labelledby="paginas-title"
            className="aurora-blue defer-render relative overflow-clip section-pad"
          >
            <div className="page-container">
              <Heading
                id="paginas-title"
                kicker={copy.pages.kicker}
                title={copy.pages.title}
                lead={copy.pages.lead}
              />
            </div>
            <PageWall ids={media.pageIds} label={copy.pages.galleryLabel} />
          </section>

          <section
            data-slot="section"
            data-tone="aurora-cream"
            aria-labelledby="momentos-title"
            className="aurora-cream defer-render relative section-pad"
          >
            <div className="page-container">
              <Heading id="momentos-title" kicker={copy.moments.kicker} title={copy.moments.title} />
              <MomentsBento items={copy.moments.items} pageId={momentPage} />
            </div>
          </section>

          <section
            id="preguntas"
            style={{ paddingBottom: "calc(var(--section-pad) + var(--section-overlap))" }}
            data-slot="section"
            data-tone="aurora-sky"
            aria-labelledby="faq-title"
            className="aurora-sky defer-render relative section-pad"
          >
            <div className="page-container grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
              <div className="grid grid-cols-1 content-start gap-4 lg:sticky lg:top-[calc(var(--header-height)+var(--space-6))] lg:self-start">
                <Kicker>{copy.faq.kicker}</Kicker>
                <h2 id="faq-title">{copy.faq.title}</h2>
                <DecisionLink variant="outline" className="mt-2 w-fit rounded-pill">
                  {copy.close.cta}
                </DecisionLink>
                {media.cards[0] ? (
                  <div aria-hidden="true" className="relative mt-8 hidden w-[80%] max-w-80 lg:block">
                    <div className="absolute -inset-6 rounded-full bg-turquoise/20 blur-2xl" />
                    <span className="relative block -rotate-4 overflow-hidden rounded-xl border-4 border-white shadow-float [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:object-cover">
                      <MediaImage id={media.cards[0]} alt="" sizes="320px" />
                    </span>
                  </div>
                ) : null}
              </div>
              <FAQ items={copy.faq.items} surface="glass" />
            </div>
          </section>

          <CloseSection copy={copy.close} />
        </PageMotion>

        <StickyCTA hideWhenVisible={STICKY_HIDE_OVER} label={product.shortName}>
          <DecisionLink>
            <span className="only-upsell">
              {copy.sticky.upsell} · {formatUsd(pricing.upsell)}
            </span>
            <span className="only-downsell">
              {copy.sticky.downsell} · {formatUsd(pricing.downsell)}
            </span>
          </DecisionLink>
        </StickyCTA>
      </OfferModeRoot>
      <Footer />
    </>
  );
}
