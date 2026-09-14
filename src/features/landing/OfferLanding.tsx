import { formatUsd } from "@config/commerce";
import { MousePointerClick } from "lucide-react";
import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { FAQ } from "@/components/ui/FAQ/FAQ";
import { FactChip } from "@/components/ui/FactChip/FactChip";
import { Icon } from "@/components/ui/Icon/Icon";
import { MediaImage } from "@/components/ui/MediaImage/MediaImage";
import { PriceBlock } from "@/components/ui/PriceBlock/PriceBlock";
import { ResourceGrid } from "@/components/ui/ResourceGrid/ResourceGrid";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { Topbar } from "@/components/ui/Topbar/Topbar";
import { HotmartWidgetSlot } from "@/features/commerce/HotmartWidgetSlot/HotmartWidgetSlot";
import { OfferModeMirror } from "@/features/commerce/OfferModeMirror";
import { OfferModeRoot } from "@/features/commerce/OfferModeRoot";
import { PageGallery } from "@/features/gallery/PageGallery/PageGallery";
import { getImage } from "@/lib/media";
import { StickyCTA } from "@/motion/StickyCTA";
import { TiltCard } from "@/motion/TiltCard";
import type { OfferProduct } from "@/products/schema";
import styles from "./OfferLanding.module.css";

type Props = { product: OfferProduct };

/**
 * Post-purchase offer. Both views are in the HTML; OfferModeRoot picks one before first
 * paint from ?downsell=1 (alias ?offer=downsell). The Hotmart sales-funnel widget is the
 * only decision control and is rendered exactly once, outside both views.
 */
export function OfferLanding({ product }: Props) {
  const { copy, media, pricing } = product;
  const galleryItems = media.pageIds.map((id) => {
    const image = getImage(id);
    return { ...image, caption: image.alt.replace(/^Página real \d+: /i, "") };
  });
  const decisionLink = (
    <a href="#gfp-decision" className="button button--primary button--small" data-decision-link>
      <MousePointerClick
        aria-hidden="true"
        focusable="false"
        size={20}
        strokeWidth={2.4}
        className="button__icon"
      />
      {copy.header.cta}
    </a>
  );

  return (
    <div className={styles.shell}>
      <Topbar tone="mint">
        <span>{copy.topbar}</span>
      </Topbar>
      <Header cta={decisionLink} subtitle={copy.header.subtitle} />
      <OfferModeRoot>
        <Suspense fallback={null}>
          <OfferModeMirror product={product.slug} prices={pricing} />
        </Suspense>

        {/* Hero — upsell view */}
        <section className={`${styles.hero} only-upsell`} id="hero" aria-labelledby="hero-title-upsell">
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className="kicker">{copy.upsell.kicker}</p>
              <h1 id="hero-title-upsell">{copy.upsell.title}</h1>
              <p className="lead">{copy.upsell.lead}</p>
              <ul className={styles.facts} role="list">
                {copy.facts.map((fact) => (
                  <li key={fact.label}>
                    <FactChip label={fact.label} detail={fact.detail} />
                  </li>
                ))}
              </ul>
              <PriceBlock
                kicker={copy.upsell.priceKicker}
                price={pricing.upsell}
                taxNote={copy.taxNote}
                cta={
                  <a href="#gfp-decision" className="button button--primary" data-decision-link>
                    <MousePointerClick
                      aria-hidden="true"
                      focusable="false"
                      size={20}
                      strokeWidth={2.4}
                      className="button__icon"
                    />
                    {copy.header.cta}
                  </a>
                }
                ctaNote={copy.upsell.decisionHint}
              />
            </div>
            <TiltCard className={styles.heroCard} max={5} as="figure">
              <MediaImage id={media.hero} sizes="(min-width: 1024px) 560px, 92vw" priority />
            </TiltCard>
          </div>
        </section>

        {/* Hero — downsell view */}
        <section
          className={`${styles.hero} ${styles.heroDownsell} only-downsell`}
          id="hero-downsell"
          aria-labelledby="hero-title-downsell"
        >
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className="kicker">{copy.downsell.kicker}</p>
              <h1 id="hero-title-downsell">{copy.downsell.title}</h1>
              <p className="lead">{copy.downsell.lead}</p>
              <p className={styles.proof}>
                <Icon name="shield" size={18} />
                {copy.downsell.proof}
              </p>
              <PriceBlock
                kicker={copy.downsell.priceKicker}
                price={pricing.downsell}
                previous={{ label: copy.downsell.previousLabel, price: pricing.upsell }}
                taxNote={copy.taxNote}
                cta={
                  <a href="#gfp-decision" className="button button--primary" data-decision-link>
                    <MousePointerClick
                      aria-hidden="true"
                      focusable="false"
                      size={20}
                      strokeWidth={2.4}
                      className="button__icon"
                    />
                    {copy.header.cta}
                  </a>
                }
                ctaNote={copy.downsell.decisionHint}
              />
            </div>
            <div className={styles.objections}>
              {copy.downsell.objections.map((item) => (
                <div key={item.title} className={styles.objection}>
                  <p className={styles.objectionTitle}>{item.title}</p>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Decision — single Hotmart widget, shared by both views */}
        <section className={`section ${styles.decision}`} aria-label="Decisión de la oferta">
          <div className={`container ${styles.decisionInner}`}>
            <HotmartWidgetSlot
              heading={
                <>
                  <div className="only-upsell">
                    <p className="kicker">{copy.decision.upsell.kicker}</p>
                    <h2 id="gfp-decision-title">{copy.decision.upsell.title}</h2>
                    <p>{copy.decision.upsell.text}</p>
                  </div>
                  <div className="only-downsell">
                    <p className="kicker">{copy.decision.downsell.kicker}</p>
                    <h2 id="gfp-decision-title-downsell">{copy.decision.downsell.title}</h2>
                    <p>{copy.decision.downsell.text}</p>
                  </div>
                </>
              }
              loadingText={copy.widget.loading}
              fallbackTitle={copy.widget.fallbackTitle}
              fallbackText={copy.widget.fallbackText}
              reloadLabel={copy.widget.reload}
            />
          </div>
        </section>

        {/* Complemento */}
        <section className="section" aria-labelledby="complemento-title">
          <div className="container">
            <SectionHeading
              id="complemento-title"
              kicker={copy.complement.kicker}
              title={copy.complement.title}
              align="center"
            />
            <div className={styles.compare}>
              <div className={`${styles.compareCard} ${styles.compareOwned}`} data-reveal>
                <p className={styles.compareLabel}>
                  <Icon name="shield" size={16} />
                  {copy.complement.ownedLabel}
                </p>
                <h3>{copy.complement.owned.title}</h3>
                <ul role="list">
                  {copy.complement.owned.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.compareArrow} aria-hidden="true">
                +
              </div>
              <div className={`${styles.compareCard} ${styles.compareOffer}`} data-reveal>
                <p className={styles.compareLabel}>
                  <Icon name="sparkles" size={16} />
                  {copy.complement.offerLabel}
                </p>
                <h3>{copy.complement.offer.title}</h3>
                <ul role="list">
                  {copy.complement.offer.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Qué incluye */}
        <section className="section section--mint" id="incluye" aria-labelledby="incluye-title">
          <div className="container">
            <SectionHeading
              id="incluye-title"
              kicker={copy.included.kicker}
              title={copy.included.title}
              lead={copy.included.lead}
            />
            <ResourceGrid resources={product.resources} total={copy.included.total} />
          </div>
        </section>

        {/* Páginas reales (upsell only; the downsell stays compact) */}
        <section className="section only-upsell" id="paginas" aria-labelledby="paginas-title">
          <div className="container">
            <SectionHeading
              id="paginas-title"
              kicker={copy.pages.kicker}
              title={copy.pages.title}
              lead={copy.pages.lead}
              align="center"
            />
            <PageGallery items={galleryItems} label={copy.pages.galleryLabel} />
          </div>
        </section>

        {/* Momentos */}
        <section className="section section--lemon" aria-labelledby="momentos-title">
          <div className="container">
            <SectionHeading id="momentos-title" kicker={copy.moments.kicker} title={copy.moments.title} />
            <ul className={styles.moments} role="list">
              {copy.moments.items.map((item, index) => (
                <li
                  key={item.title}
                  className={styles.moment}
                  data-reveal
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <span className={styles.momentIcon}>
                    <Icon name={item.icon} size={24} strokeWidth={2.2} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="preguntas" aria-labelledby="faq-title">
          <div className={`container ${styles.faq}`}>
            <SectionHeading id="faq-title" kicker={copy.faq.kicker} title={copy.faq.title} />
            <FAQ items={copy.faq.items} />
          </div>
        </section>

        {/* Cierre */}
        <section
          className={`section section--navy ${styles.close}`}
          id="cierre"
          aria-labelledby="cierre-title"
        >
          <div className={`container ${styles.closeInner}`} data-reveal>
            <p className="kicker">{copy.close.kicker}</p>
            <h2 id="cierre-title">{copy.close.title}</h2>
            <p className="lead">{copy.close.text}</p>
            <a href="#gfp-decision" className="button button--inverse" data-decision-link>
              <MousePointerClick
                aria-hidden="true"
                focusable="false"
                size={20}
                strokeWidth={2.4}
                className="button__icon"
              />
              {copy.close.cta}
            </a>
          </div>
        </section>

        <StickyCTA hideWhenVisible={["#gfp-decision", "#cierre", "footer"]} label={product.name}>
          <a href="#gfp-decision" className="button button--primary" data-decision-link>
            <span className="only-upsell">
              {copy.sticky.upsell} · {formatUsd(pricing.upsell)}
            </span>
            <span className="only-downsell">
              {copy.sticky.downsell} · {formatUsd(pricing.downsell)}
            </span>
          </a>
        </StickyCTA>
      </OfferModeRoot>
      <Footer />
    </div>
  );
}
