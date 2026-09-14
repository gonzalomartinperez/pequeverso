import { formatUsd } from "@config/commerce";
import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import { FAQ } from "@/components/ui/FAQ/FAQ";
import { IconCardList } from "@/components/ui/IconCardList/IconCardList";
import { ResourceGrid } from "@/components/ui/ResourceGrid/ResourceGrid";
import { Section } from "@/components/ui/Section/Section";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { Split } from "@/components/ui/Split/Split";
import { Stack } from "@/components/ui/Stack/Stack";
import { Topbar } from "@/components/ui/Topbar/Topbar";
import { DecisionLink } from "@/features/commerce/DecisionLink/DecisionLink";
import { HotmartWidgetSlot } from "@/features/commerce/HotmartWidgetSlot/HotmartWidgetSlot";
import { OfferModeMirror } from "@/features/commerce/OfferModeMirror";
import { OfferModeRoot } from "@/features/commerce/OfferModeRoot";
import { GallerySlide } from "@/features/gallery/PageGallery/GallerySlide";
import { PageGallery } from "@/features/gallery/PageGallery/PageGallery";
import { getImage } from "@/lib/media";
import { StickyCTA } from "@/motion/StickyCTA";
import type { OfferProduct } from "@/products/schema";
import styles from "./OfferLanding.module.css";
import { CloseSection } from "./offer/CloseSection";
import { ComplementSection } from "./offer/ComplementSection";
import { DownsellHero } from "./offer/DownsellHero";
import { type CounterFact, UpsellHero } from "./offer/UpsellHero";

type Props = { product: OfferProduct };

const STICKY_HIDE_OVER = ["#gfp-decision", "#cierre", "footer"];

function counterFacts({ composition, copy, resources }: OfferProduct): CounterFact[] {
  const units = copy.counters;
  if (!units) return [];
  return [
    { value: composition.pdfCount, unit: units.pdf },
    { value: composition.pageCount, unit: units.pages },
    { value: composition.visibleResources ?? resources.length, unit: units.resources },
  ];
}

function pageCaption(id: string): string {
  return getImage(id).alt.replace(/^Página real \d+: /i, "");
}

/**
 * Post-purchase offer. Both views are in the HTML; OfferModeRoot picks one before first
 * paint from ?downsell=1 (alias ?offer=downsell). The Hotmart sales-funnel widget is the
 * only decision control and is rendered exactly once, outside both views.
 */
export function OfferLanding({ product }: Props) {
  const { copy, media, pricing } = product;
  return (
    <>
      <Topbar tone="mint">
        <span>{copy.topbar}</span>
      </Topbar>
      <Header
        cta={<DecisionLink size="small">{copy.header.cta}</DecisionLink>}
        subtitle={copy.header.subtitle}
      />
      <OfferModeRoot>
        <Suspense fallback={null}>
          <OfferModeMirror product={product.slug} prices={pricing} />
        </Suspense>
        <UpsellHero product={product} counters={counterFacts(product)} />
        <DownsellHero product={product} />
        <Section tone="navy" label="Decisión de la oferta" className={styles.decision}>
          <div className={styles.slot}>
            <HotmartWidgetSlot
              heading={
                <>
                  <Stack gap={2} className="only-upsell">
                    <Eyebrow as="span">{copy.decision.upsell.kicker}</Eyebrow>
                    <h2 id="gfp-decision-title">{copy.decision.upsell.title}</h2>
                    <p>{copy.decision.upsell.text}</p>
                  </Stack>
                  <Stack gap={2} className="only-downsell">
                    <Eyebrow as="span">{copy.decision.downsell.kicker}</Eyebrow>
                    <h2 id="gfp-decision-title-downsell">{copy.decision.downsell.title}</h2>
                    <p>{copy.decision.downsell.text}</p>
                  </Stack>
                </>
              }
              loadingText={copy.widget.loading}
              fallbackTitle={copy.widget.fallbackTitle}
              fallbackText={copy.widget.fallbackText}
              reloadLabel={copy.widget.reload}
            />
          </div>
        </Section>
        <ComplementSection copy={copy.complement} />

        <Section tone="mint" id="incluye" labelledBy="incluye-title" defer>
          <SectionHeading
            id="incluye-title"
            kicker={copy.included.kicker}
            title={copy.included.title}
            lead={copy.included.lead}
          />
          <ResourceGrid resources={product.resources} total={copy.included.total} />
        </Section>

        <Section tone="cream" id="paginas" labelledBy="paginas-title" className="only-upsell" defer>
          <SectionHeading
            id="paginas-title"
            kicker={copy.pages.kicker}
            title={copy.pages.title}
            lead={copy.pages.lead}
            align="center"
          />
          <PageGallery label={copy.pages.galleryLabel} count={media.pageIds.length}>
            {media.pageIds.map((id) => (
              <GallerySlide key={id} id={id} caption={pageCaption(id)} />
            ))}
          </PageGallery>
        </Section>

        <Section tone="white" labelledBy="momentos-title" defer>
          <SectionHeading id="momentos-title" kicker={copy.moments.kicker} title={copy.moments.title} />
          <IconCardList items={copy.moments.items} cols={4} />
        </Section>

        <Section tone="cream" id="preguntas" labelledBy="faq-title" defer>
          <Split ratio="0.8/1.2">
            <SectionHeading id="faq-title" kicker={copy.faq.kicker} title={copy.faq.title} />
            <FAQ items={copy.faq.items} />
          </Split>
        </Section>

        <CloseSection copy={copy.close} />

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
