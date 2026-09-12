import { formatUsd, products } from "@config/commerce";
import { site } from "@config/site";
import { homeCopy as copy } from "@content/es/home";
import { grafismoPageIds } from "@content/es/products";
import { ArrowDown } from "lucide-react";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon/Icon";
import { MediaImage } from "@/components/MediaImage/MediaImage";
import { PageShell } from "@/components/PageShell/PageShell";
import { ProductInterestLink } from "@/components/ProductInterestLink/ProductInterestLink";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { SocialLinks } from "@/components/SocialLinks/SocialLinks";
import { Steps } from "@/components/Steps/Steps";
import { TiltCard } from "@/components/TiltCard/TiltCard";
import { Universe } from "@/components/Universe/Universe";
import { buildMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

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

const product = products.grafismoFonetico;

export default function HomePage() {
  const headerCta = (
    <ProductInterestLink
      href="/grafismo-fonetico/"
      position="header"
      className="button button--primary button--small"
    >
      {copy.hero.cta}
    </ProductInterestLink>
  );

  return (
    <PageShell
      nav={[
        { href: "#empieza", label: "Empieza por aquí" },
        { href: "#metodo", label: "Cómo lo usamos" },
        { href: "#valores", label: "Qué esperar" },
      ]}
      cta={headerCta}
    >
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from config
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* Hero */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Universe variant="hero" />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className="kicker">{copy.hero.kicker}</p>
            <h1 id="hero-title" className={styles.heroTitle}>
              {copy.hero.title}
            </h1>
            <p className={`lead ${styles.heroLead}`}>{copy.hero.lead}</p>
            <ul className={styles.chips} role="list">
              {copy.hero.chips.map((chip) => (
                <li key={chip}>
                  <Icon name="star" size={14} />
                  {chip}
                </li>
              ))}
            </ul>
            <div className={styles.heroActions}>
              <ProductInterestLink
                href="/grafismo-fonetico/"
                position="hero"
                className="button button--primary"
              >
                {copy.hero.cta}
              </ProductInterestLink>
              <a href="#metodo" className="button button--inverse">
                <span>{copy.hero.secondary}</span>
                <ArrowDown
                  aria-hidden="true"
                  focusable="false"
                  size={18}
                  strokeWidth={2.4}
                  className="button__icon"
                />
              </a>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.stack} aria-hidden="true">
              <div className={`${styles.stackPage} ${styles.stackPageA}`}>
                <MediaImage id={grafismoPageIds[1] ?? "gf.page.02"} sizes="220px" alt="" />
              </div>
              <div className={`${styles.stackPage} ${styles.stackPageB}`}>
                <MediaImage id={grafismoPageIds[4] ?? "gf.page.05"} sizes="220px" alt="" />
              </div>
            </div>
            <TiltCard className={styles.productCard} max={5} as="article">
              <div className={styles.productImage}>
                <MediaImage id="gf.hero" sizes="(min-width: 1024px) 520px, 92vw" priority />
              </div>
              <div className={styles.productBody}>
                <p className={styles.productKicker}>{copy.product.kicker}</p>
                <h2 className={styles.productTitle}>{copy.product.title}</h2>
                <p className={styles.productPromise}>{copy.product.promise}</p>
                <ul className={styles.productFacts} role="list">
                  {copy.product.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <div className={styles.productPriceRow}>
                  <p className={styles.productPrice}>
                    <span className={styles.productPriceKicker}>{copy.product.priceKicker}</span>
                    <span>{formatUsd(product.price)}</span>
                  </p>
                  <ProductInterestLink
                    href="/grafismo-fonetico/"
                    position="hero-card"
                    className="button button--primary button--small"
                  >
                    {copy.product.cta}
                  </ProductInterestLink>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Empieza por aquí */}
      <section className="section" id="empieza" aria-labelledby="empieza-title">
        <div className="container">
          <SectionHeading
            id="empieza-title"
            kicker={copy.start.kicker}
            title={copy.start.title}
            lead={copy.start.lead}
          />
          <div className={styles.startGrid}>
            <article className={`${styles.startCard} ${styles.startPrincipal}`} data-reveal>
              <p className={styles.startLabel}>
                <Icon name="star" size={16} />
                {copy.start.principal.label}
              </p>
              <h3>{copy.start.principal.title}</h3>
              <p>{copy.start.principal.text}</p>
              <ul className={styles.startPoints} role="list">
                {copy.start.principal.points.map((point) => (
                  <li key={point}>
                    <Icon name="link" size={16} />
                    {point}
                  </li>
                ))}
              </ul>
              <ProductInterestLink
                href="/grafismo-fonetico/"
                position="start"
                className="button button--primary button--small"
              >
                {copy.start.principal.cta}
              </ProductInterestLink>
            </article>
            <article className={`${styles.startCard} ${styles.startComplement}`} data-reveal>
              <p className={styles.startLabel}>
                <Icon name="sparkles" size={16} />
                {copy.start.complement.label}
              </p>
              <h3>{copy.start.complement.title}</h3>
              <p>{copy.start.complement.text}</p>
              <ul className={styles.startPoints} role="list">
                {copy.start.complement.points.map((point) => (
                  <li key={point}>
                    <Icon name="link" size={16} />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Páginas reales */}
      <section className="section section--sky" aria-labelledby="preview-title">
        <div className="container">
          <SectionHeading
            id="preview-title"
            kicker={copy.preview.kicker}
            title={copy.preview.title}
            lead={copy.preview.lead}
            align="center"
          />
          <ul className={styles.previewGrid} role="list">
            {[grafismoPageIds[0], grafismoPageIds[6], grafismoPageIds[12]].map((id, index) => (
              <li key={id} data-reveal style={{ transitionDelay: `${index * 80}ms` }}>
                <TiltCard className={styles.previewCard} max={6} as="figure">
                  <MediaImage
                    id={id ?? "gf.page.01"}
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                  />
                </TiltCard>
              </li>
            ))}
          </ul>
          <p className={styles.previewCta}>
            <ProductInterestLink
              href="/grafismo-fonetico/#paginas"
              position="preview"
              className="button button--secondary"
            >
              Ver las 20 páginas reales
            </ProductInterestLink>
          </p>
        </div>
      </section>

      {/* Método */}
      <section className={`section ${styles.methodSection}`} id="metodo" aria-labelledby="metodo-title">
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

      {/* Valores */}
      <section className="section" id="valores" aria-labelledby="valores-title">
        <div className="container">
          <SectionHeading id="valores-title" kicker={copy.values.kicker} title={copy.values.title} />
          <ul className={styles.valuesGrid} role="list">
            {copy.values.items.map((item, index) => (
              <li
                key={item.title}
                className={styles.valueCard}
                data-reveal
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <span className={styles.valueIcon}>
                  <Icon name={item.icon} size={26} strokeWidth={2.2} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cierre */}
      <section className="section" aria-labelledby="cierre-title">
        <div className="container">
          <div className={styles.closing} data-reveal>
            <Universe variant="band" />
            <div className={styles.closingInner}>
              <p className="kicker">{copy.closing.kicker}</p>
              <h2 id="cierre-title">{copy.closing.title}</h2>
              <p className="lead">{copy.closing.text}</p>
              <div className={styles.closingActions}>
                <ProductInterestLink
                  href="/grafismo-fonetico/"
                  position="closing"
                  className="button button--primary"
                >
                  {copy.closing.cta}
                </ProductInterestLink>
                <span className={styles.closingPrice}>{formatUsd(product.price)} · pago único</span>
              </div>
              <div className={styles.closingSocial}>
                <p>Síguenos: ideas y páginas nuevas cada semana en @somospequeverso</p>
                <SocialLinks tone="dark" showLabels />
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
