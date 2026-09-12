import { formatUsd, products } from "@config/commerce";
import { site } from "@config/site";
import { grafismoCopy as copy } from "@content/es/grafismo-fonetico";
import { grafismoPageIds, grafismoResources } from "@content/es/products";
import type { Metadata } from "next";
import { CheckoutLink } from "@/components/CheckoutLink/CheckoutLink";
import { FAQ } from "@/components/FAQ/FAQ";
import { FactChip } from "@/components/FactChip/FactChip";
import { Icon } from "@/components/Icon/Icon";
import { MediaImage } from "@/components/MediaImage/MediaImage";
import { PageGallery } from "@/components/PageGallery/PageGallery";
import { PageShell } from "@/components/PageShell/PageShell";
import { PriceBlock } from "@/components/PriceBlock/PriceBlock";
import { ResourceGrid } from "@/components/ResourceGrid/ResourceGrid";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { Steps } from "@/components/Steps/Steps";
import { StickyCTA } from "@/components/StickyCTA/StickyCTA";
import { TiltCard } from "@/components/TiltCard/TiltCard";
import { Topbar } from "@/components/Topbar/Topbar";
import { TrustStrip } from "@/components/TrustStrip/TrustStrip";
import { Universe } from "@/components/Universe/Universe";
import { VideoBlock } from "@/components/VideoBlock/VideoBlock";
import { ViewContentOnMount } from "@/components/ViewContentOnMount/ViewContentOnMount";
import { getImage, getVideo } from "@/lib/media";
import { buildMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

const product = products.grafismoFonetico;

export const metadata: Metadata = buildMetadata({
  path: "/grafismo-fonetico/",
  title: copy.meta.title,
  description: copy.meta.description,
  image: getImage("gf.hero").src,
  imageAlt: getImage("gf.hero").alt,
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Pequeverso", item: `${site.url}/` },
    { "@type": "ListItem", position: 2, name: product.name, item: `${site.url}/grafismo-fonetico/` },
  ],
};

export default function GrafismoFoneticoPage() {
  const galleryItems = grafismoPageIds.map((id) => {
    const image = getImage(id);
    return { id, ...image, caption: image.alt.replace(/^Página real \d+: /i, "") };
  });
  const videos = ["video.gf.bota", "video.gf.mapa", "video.gf.paloma", "video.gf.maleta"].map((id) => ({
    id,
    ...getVideo(id),
  }));

  const headerCta = (
    <CheckoutLink position="header" className="button button--primary button--small">
      Comprar · {formatUsd(product.price)}
    </CheckoutLink>
  );

  return (
    <PageShell
      topbar={<Topbar items={copy.topbar} />}
      nav={copy.nav}
      cta={headerCta}
      subtitle="Kit imprimible paso a paso"
    >
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from config
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ViewContentOnMount product={product.slug} name={product.name} value={product.price} />

      {/* Hero */}
      <section className={styles.hero} id="hero" aria-labelledby="hero-title">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className="kicker">{copy.hero.kicker}</p>
            <h1 id="hero-title">{copy.hero.title}</h1>
            <p className="lead">{copy.hero.lead}</p>
            <ul className={styles.facts} role="list">
              {copy.hero.facts.map((fact) => (
                <li key={fact.label}>
                  <FactChip icon={fact.icon} label={fact.label} detail={fact.detail} />
                </li>
              ))}
            </ul>
            <PriceBlock
              id="comprar"
              kicker={copy.hero.priceKicker}
              price={product.price}
              taxNote={copy.hero.taxNote}
              currencyNote={copy.hero.currencyNote}
              cta={
                <CheckoutLink position="hero" className="button button--primary">
                  {copy.hero.cta}
                </CheckoutLink>
              }
              ctaNote={copy.hero.ctaNote}
            />
          </div>
          <div className={styles.heroVisual}>
            <TiltCard className={styles.heroCard} max={5} as="figure">
              <MediaImage id="gf.hero" sizes="(min-width: 1024px) 560px, 92vw" priority />
            </TiltCard>
            <ul className={styles.heroThumbs} role="list" aria-label="Páginas de ejemplo">
              {[grafismoPageIds[0], grafismoPageIds[3], grafismoPageIds[8]].map((id) => (
                <li key={id}>
                  <a href="#paginas" className={styles.heroThumb}>
                    <MediaImage id={id ?? "gf.page.01"} sizes="160px" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <TrustStrip items={copy.trust} />

      {/* Problema */}
      <section className="section" aria-labelledby="problema-title">
        <div className={`container ${styles.problem}`}>
          <div className={styles.problemCopy} data-reveal>
            <p className="kicker">{copy.problem.kicker}</p>
            <h2 id="problema-title">{copy.problem.title}</h2>
            {copy.problem.paragraphs.map((paragraph) => (
              <p key={paragraph} className="lead">
                {paragraph}
              </p>
            ))}
            <ul className={styles.bullets} role="list">
              {copy.problem.bullets.map((bullet) => (
                <li key={bullet}>
                  <Icon name="star" size={18} />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <TiltCard className={styles.problemImage} max={4} as="figure">
            <MediaImage id="gf.scene.mesa" sizes="(min-width: 1024px) 520px, 92vw" />
          </TiltCard>
        </div>
      </section>

      {/* Método */}
      <section className={`section ${styles.method}`} id="metodo" aria-labelledby="metodo-title">
        <Universe variant="band" />
        <div className={`container ${styles.methodInner}`}>
          <SectionHeading
            id="metodo-title"
            kicker={copy.method.kicker}
            title={copy.method.title}
            lead={copy.method.lead}
            align="center"
            tone="dark"
          />
          <Steps steps={copy.method.steps} tone="dark" />
        </div>
      </section>

      {/* Páginas reales */}
      <section className="section section--sky" id="paginas" aria-labelledby="paginas-title">
        <div className="container">
          <SectionHeading
            id="paginas-title"
            kicker={copy.pages.kicker}
            title={copy.pages.title}
            lead={copy.pages.lead}
            align="center"
          />
          <PageGallery items={galleryItems} label="Páginas reales del kit" zoomHint={copy.pages.zoomHint} />
        </div>
      </section>

      {/* Qué incluye */}
      <section className="section" id="incluye" aria-labelledby="incluye-title">
        <div className="container">
          <SectionHeading
            id="incluye-title"
            kicker={copy.included.kicker}
            title={copy.included.title}
            lead={copy.included.lead}
          />
          <ResourceGrid resources={grafismoResources} total={copy.included.total} />
        </div>
      </section>

      {/* Oferta intermedia */}
      <section className={`section ${styles.midOffer}`} aria-labelledby="mid-title">
        <Universe variant="band" />
        <div className={`container ${styles.midInner}`} data-reveal>
          <div>
            <h2 id="mid-title">{copy.midOffer.title}</h2>
            <p className="lead">{copy.midOffer.text}</p>
          </div>
          <div className={styles.midAction}>
            <CheckoutLink position="mid" className="button button--primary">
              {copy.midOffer.cta}
            </CheckoutLink>
            <span>{formatUsd(product.price)} · pago único</span>
          </div>
        </div>
      </section>

      {/* Videos */}
      <section className="section" id="videos" aria-labelledby="videos-title">
        <div className="container">
          <SectionHeading
            id="videos-title"
            kicker={copy.videos.kicker}
            title={copy.videos.title}
            lead={copy.videos.lead}
            align="center"
          />
          <VideoBlock items={videos} />
        </div>
      </section>

      {/* Enfoque */}
      <section className="section section--lemon" aria-labelledby="enfoque-title">
        <div className={`container ${styles.credibility}`}>
          <TiltCard className={styles.credibilityImage} max={4} as="figure">
            <MediaImage id="gf.scene.trazo" sizes="(min-width: 1024px) 480px, 92vw" />
          </TiltCard>
          <div data-reveal>
            <p className="kicker">{copy.credibility.kicker}</p>
            <h2 id="enfoque-title">{copy.credibility.title}</h2>
            <p className="lead">{copy.credibility.text}</p>
            <ul className={styles.bullets} role="list">
              {copy.credibility.points.map((point) => (
                <li key={point}>
                  <Icon name="link" size={18} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="section" aria-labelledby="beneficios-title">
        <div className="container">
          <SectionHeading id="beneficios-title" kicker={copy.benefits.kicker} title={copy.benefits.title} />
          <ul className={styles.benefits} role="list">
            {copy.benefits.items.map((item, index) => (
              <li
                key={item.title}
                className={styles.benefit}
                data-reveal
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <span className={styles.benefitIcon}>
                  <Icon name={item.icon} size={24} strokeWidth={2.2} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
          <p className={styles.callout} data-reveal>
            {copy.benefits.callout}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section--mint" id="preguntas" aria-labelledby="faq-title">
        <div className={`container ${styles.faq}`}>
          <div className={styles.faqIntro}>
            <SectionHeading id="faq-title" kicker={copy.faq.kicker} title={copy.faq.title} />
            <p className={styles.faqSupport}>
              {copy.faq.supportNote} <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
            </p>
          </div>
          <FAQ items={copy.faq.items} />
        </div>
      </section>

      {/* Oferta final */}
      <section className={`section ${styles.finalOffer}`} id="oferta-final" aria-labelledby="final-title">
        <div className={`container ${styles.finalInner}`}>
          <div className={styles.finalCopy} data-reveal>
            <p className="kicker">{copy.finalOffer.kicker}</p>
            <h2 id="final-title">{copy.finalOffer.title}</h2>
            <ul className={styles.checks} role="list">
              {copy.finalOffer.checks.map((check) => (
                <li key={check}>
                  <Icon name="shield" size={18} />
                  {check}
                </li>
              ))}
            </ul>
          </div>
          <PriceBlock
            kicker={copy.hero.priceKicker}
            price={product.price}
            taxNote={copy.hero.taxNote}
            cta={
              <CheckoutLink position="final" className="button button--primary">
                {copy.finalOffer.cta}
              </CheckoutLink>
            }
            ctaNote={copy.finalOffer.note}
          />
        </div>
      </section>

      <StickyCTA
        hideWhenVisible={["#hero", "#oferta-final", "footer"]}
        label={`${copy.sticky.label} · ${formatUsd(product.price)}`}
      >
        <CheckoutLink position="sticky" className="button button--primary">
          {copy.sticky.cta}
        </CheckoutLink>
      </StickyCTA>
    </PageShell>
  );
}
