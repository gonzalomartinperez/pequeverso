import { formatUsd, products } from "@config/commerce";
import { packCopy as copy } from "@content/es/imprime-y-juega";
import { packPageIds, packResources } from "@content/es/products";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FAQ } from "@/components/FAQ/FAQ";
import { FactChip } from "@/components/FactChip/FactChip";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { HotmartWidgetSlot } from "@/components/HotmartWidgetSlot/HotmartWidgetSlot";
import { Icon } from "@/components/Icon/Icon";
import { MediaImage } from "@/components/MediaImage/MediaImage";
import { OfferModeMirror } from "@/components/OfferMode/OfferModeMirror";
import { OfferModeRoot } from "@/components/OfferMode/OfferModeRoot";
import { PageGallery } from "@/components/PageGallery/PageGallery";
import { PriceBlock } from "@/components/PriceBlock/PriceBlock";
import { ResourceGrid } from "@/components/ResourceGrid/ResourceGrid";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { StickyCTA } from "@/components/StickyCTA/StickyCTA";
import { TiltCard } from "@/components/TiltCard/TiltCard";
import { Topbar } from "@/components/Topbar/Topbar";
import { getImage } from "@/lib/media";
import { buildMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

const pack = products.imprimeYJuega;

export const metadata: Metadata = buildMetadata({
  path: "/imprime-y-juega/",
  title: copy.meta.title,
  description: copy.meta.description,
  noindex: true,
  image: getImage("pack.hero").src,
  imageAlt: getImage("pack.hero").alt,
});

/**
 * Post-purchase offer. Both views are in the HTML; OfferModeRoot picks one before first
 * paint from ?downsell=1 (alias ?offer=downsell). The Hotmart sales-funnel widget is the
 * only decision control and is rendered exactly once, outside both views.
 */
export default function ImprimeYJuegaPage() {
  const galleryItems = packPageIds.map((id) => {
    const image = getImage(id);
    return { ...image, caption: image.alt.replace(/^Página real \d+: /i, "") };
  });

  const decisionLink = (
    <a href="#decision" className="button button--primary button--small" data-decision-link>
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
          <OfferModeMirror
            product={pack.slug}
            prices={{ upsell: pack.upsellPrice, downsell: pack.downsellPrice }}
          />
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
                price={pack.upsellPrice}
                taxNote="+ impuestos aplicables según el país"
                cta={
                  <a href="#decision" className="button button--primary" data-decision-link>
                    {copy.header.cta}
                  </a>
                }
                ctaNote={copy.upsell.decisionHint}
              />
            </div>
            <TiltCard className={styles.heroCard} max={5} as="figure">
              <MediaImage id="pack.hero" sizes="(min-width: 1024px) 560px, 92vw" priority />
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
                price={pack.downsellPrice}
                previous={{ label: copy.downsell.previousLabel, price: pack.upsellPrice }}
                taxNote="+ impuestos aplicables según el país"
                cta={
                  <a href="#decision" className="button button--primary" data-decision-link>
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
                  Ya es tuyo
                </p>
                <h3>{copy.complement.grafismo.title}</h3>
                <ul role="list">
                  {copy.complement.grafismo.points.map((point) => (
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
                  Esta oferta
                </p>
                <h3>{copy.complement.pack.title}</h3>
                <ul role="list">
                  {copy.complement.pack.points.map((point) => (
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
            <ResourceGrid resources={packResources} total={copy.included.total} />
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
            <PageGallery items={galleryItems} label="Páginas reales del pack" />
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
            <a href="#decision" className="button button--inverse" data-decision-link>
              {copy.close.cta}
            </a>
          </div>
        </section>

        <StickyCTA hideWhenVisible={["#decision", "#cierre", "footer"]} label={`${pack.name}`}>
          <a href="#decision" className="button button--primary" data-decision-link>
            <span className="only-upsell">
              {copy.sticky.upsell} · {formatUsd(pack.upsellPrice)}
            </span>
            <span className="only-downsell">
              {copy.sticky.downsell} · {formatUsd(pack.downsellPrice)}
            </span>
          </a>
        </StickyCTA>
      </OfferModeRoot>
      <Footer />
    </div>
  );
}
