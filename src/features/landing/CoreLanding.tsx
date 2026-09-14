import { formatUsd } from "@config/commerce";
import { site } from "@config/site";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { FAQ } from "@/components/ui/FAQ/FAQ";
import { FactChip } from "@/components/ui/FactChip/FactChip";
import { Icon } from "@/components/ui/Icon/Icon";
import { MediaImage } from "@/components/ui/MediaImage/MediaImage";
import { PriceBlock } from "@/components/ui/PriceBlock/PriceBlock";
import { ResourceGrid } from "@/components/ui/ResourceGrid/ResourceGrid";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { Steps } from "@/components/ui/Steps/Steps";
import { Topbar } from "@/components/ui/Topbar/Topbar";
import { TrustStrip } from "@/components/ui/TrustStrip/TrustStrip";
import { CheckoutLink, type CheckoutTarget } from "@/features/commerce/CheckoutLink/CheckoutLink";
import { ViewContentOnMount } from "@/features/commerce/ViewContentOnMount/ViewContentOnMount";
import { PageGallery } from "@/features/gallery/PageGallery/PageGallery";
import { VideoBlock } from "@/features/gallery/VideoBlock/VideoBlock";
import { getImage, getVideo } from "@/lib/media";
import { StickyCTA } from "@/motion/StickyCTA";
import { TiltCard } from "@/motion/TiltCard";
import { Universe } from "@/motion/Universe";
import { checkoutFallbackPath } from "@/products";
import { breadcrumbJsonLd, productJsonLd } from "@/products/jsonld";
import type { CoreProduct } from "@/products/schema";
import styles from "./CoreLanding.module.css";

type Props = { product: CoreProduct };

function checkoutTarget(product: CoreProduct): CheckoutTarget {
  return {
    slug: product.slug,
    checkoutUrl: product.checkout.url,
    offer: product.checkout.offer,
    sckPrefix: product.checkout.sckPrefix,
    fallbackPath: checkoutFallbackPath(product),
  };
}

function jsonLdScript(data: Record<string, unknown> | null) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from the registry
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Principal product landing: hero with price, method, real pages, resources, videos, FAQ, final offer. */
export function CoreLanding({ product }: Props) {
  const { copy, media } = product;
  const price = product.pricing.list;
  const target = checkoutTarget(product);
  const pageAt = (index: number): string => media.pageIds[index] ?? media.hero;
  const galleryItems = media.pageIds.map((id) => {
    const image = getImage(id);
    return { ...image, caption: image.alt.replace(/^Página real \d+: /i, "") };
  });
  const videos = media.videoIds.map((id) => getVideo(id));

  const headerCta = (
    <CheckoutLink product={target} position="header" className="button button--primary button--small">
      Comprar · {formatUsd(price)}
    </CheckoutLink>
  );

  return (
    <PageShell
      topbar={<Topbar items={copy.topbar} />}
      nav={copy.nav}
      cta={headerCta}
      subtitle={copy.subtitle}
    >
      {jsonLdScript(productJsonLd(product))}
      {jsonLdScript(breadcrumbJsonLd(product))}
      <ViewContentOnMount product={product.slug} name={product.name} value={price} />
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
              price={price}
              taxNote={copy.hero.taxNote}
              currencyNote={copy.hero.currencyNote}
              cta={
                <CheckoutLink product={target} position="hero" className="button button--primary">
                  {copy.hero.cta}
                </CheckoutLink>
              }
              ctaNote={copy.hero.ctaNote}
            />
          </div>
          <div className={styles.heroVisual}>
            <TiltCard className={styles.heroCard} max={5} as="figure">
              <MediaImage id={media.hero} sizes="(min-width: 1024px) 560px, 92vw" priority />
            </TiltCard>
            <ul className={styles.heroThumbs} role="list" aria-label="Páginas de ejemplo">
              {[pageAt(0), pageAt(3), pageAt(8)].map((id) => (
                <li key={id}>
                  <a href="#paginas" className={styles.heroThumb}>
                    <MediaImage id={id} sizes="160px" />
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
            <MediaImage id={media.scenes.problem} sizes="(min-width: 1024px) 520px, 92vw" />
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
          <PageGallery items={galleryItems} label={copy.pages.galleryLabel} zoomHint={copy.pages.zoomHint} />
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
          <ResourceGrid resources={product.resources} total={copy.included.total} />
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
            <CheckoutLink product={target} position="mid" className="button button--primary">
              {copy.midOffer.cta}
            </CheckoutLink>
            <span>{formatUsd(price)} · pago único</span>
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
            <MediaImage id={media.scenes.credibility} sizes="(min-width: 1024px) 480px, 92vw" />
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
            price={price}
            taxNote={copy.hero.taxNote}
            cta={
              <CheckoutLink product={target} position="final" className="button button--primary">
                {copy.finalOffer.cta}
              </CheckoutLink>
            }
            ctaNote={copy.finalOffer.note}
          />
        </div>
      </section>

      <StickyCTA
        hideWhenVisible={["#hero", "#oferta-final", "footer"]}
        label={`${copy.sticky.label} · ${formatUsd(price)}`}
      >
        <CheckoutLink product={target} position="sticky" className="button button--primary">
          {copy.sticky.cta}
        </CheckoutLink>
      </StickyCTA>
    </PageShell>
  );
}
