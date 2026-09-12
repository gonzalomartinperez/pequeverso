import { guaranteeDays, hotmart } from "@config/commerce";
import { site } from "@config/site";
import { graciasCopy as copy } from "@content/es/gracias";
import { grafismoResources } from "@content/es/products";
import { LogIn } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CTAButton } from "@/components/CTAButton/CTAButton";
import { FactChip } from "@/components/FactChip/FactChip";
import { Icon, type IconName } from "@/components/Icon/Icon";
import { Notice } from "@/components/Notice/Notice";
import { PageShell } from "@/components/PageShell/PageShell";
import { ResourceGrid } from "@/components/ResourceGrid/ResourceGrid";
import { SectionHeading } from "@/components/SectionHeading/SectionHeading";
import { Topbar } from "@/components/Topbar/Topbar";
import { Universe } from "@/components/Universe/Universe";
import { buildMetadata } from "@/lib/metadata";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata({
  path: "/grafismo-fonetico/gracias/",
  title: copy.meta.title,
  description: copy.meta.description,
  noindex: true,
});

/**
 * Post-purchase guidance. The URL is not proof of payment: no files are linked, no purchase
 * event is fired, and visitors without a purchase are pointed to the landing.
 */
export default function GraciasPage() {
  const headerCta = (
    <CTAButton href={hotmart.consumerArea} variant="primary" size="small" external icon={LogIn}>
      Abrir Hotmart
    </CTAButton>
  );

  return (
    <PageShell
      topbar={<Topbar tone="mint">{copy.topbar}</Topbar>}
      cta={headerCta}
      subtitle="Acceso a tu compra"
    >
      {/* Hero */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <Universe variant="hero" />
        <div className={`container ${styles.heroInner}`}>
          <p className="kicker">{copy.hero.kicker}</p>
          <h1 id="hero-title">{copy.hero.title}</h1>
          <p className="lead">{copy.hero.lead}</p>
          <ul className={styles.facts} role="list">
            {copy.hero.facts.map((fact) => (
              <li key={fact}>
                <FactChip label={fact} tone="dark" />
              </li>
            ))}
          </ul>
          <div className={styles.heroActions}>
            <CTAButton href={hotmart.consumerArea} variant="primary" external icon={LogIn}>
              {copy.hero.cta}
            </CTAButton>
            <p className={styles.heroNote}>{copy.hero.note}</p>
          </div>
        </div>
      </section>

      {/* Acceso */}
      <section className="section" aria-labelledby="acceso-title">
        <div className="container">
          <SectionHeading id="acceso-title" kicker={copy.access.kicker} title={copy.access.title} />
          <ol className={styles.steps} role="list">
            {copy.access.steps.map((step, index) => (
              <li
                key={step.title}
                className={styles.step}
                data-reveal
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <span className={styles.stepBadge}>
                  <Icon name={step.icon as IconName} size={24} strokeWidth={2.2} />
                  <span aria-hidden="true">{index + 1}</span>
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <p className={styles.accessCta}>
            <CTAButton href={hotmart.consumerArea} variant="secondary" external>
              {copy.access.cta}
            </CTAButton>
          </p>
        </div>
      </section>

      {/* Primera práctica */}
      <section className="section section--sky" aria-labelledby="practica-title">
        <div className={`container ${styles.practice}`}>
          <div>
            <SectionHeading
              id="practica-title"
              kicker={copy.firstPractice.kicker}
              title={copy.firstPractice.title}
            />
            <ol className={styles.practiceList}>
              {copy.firstPractice.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <Notice tone="warning" title="Tú eliges cuánto imprimir">
            <p>{copy.firstPractice.printNote}</p>
          </Notice>
        </div>
      </section>

      {/* Recursos */}
      <section className="section" aria-labelledby="recursos-title">
        <div className="container">
          <SectionHeading id="recursos-title" kicker={copy.resources.kicker} title={copy.resources.title} />
          <ResourceGrid resources={grafismoResources} compact />
        </div>
      </section>

      {/* Ayuda */}
      <section className="section section--mint" aria-labelledby="ayuda-title">
        <div className="container">
          <SectionHeading id="ayuda-title" kicker={copy.help.kicker} title={copy.help.title} />
          <ul className={styles.help} role="list">
            {copy.help.items.map((item) => (
              <li key={item.title} className={styles.helpCard} data-reveal>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
          <p className={styles.contact}>
            {copy.help.contact} <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> · Reembolsos:{" "}
            <a href={hotmart.refunds}>refund.hotmart.com</a> ({guaranteeDays} días).
          </p>
        </div>
      </section>

      {/* Pack note + no-purchase branch */}
      <section className="section" aria-label="Notas finales">
        <div className={`container ${styles.notes}`}>
          <Notice tone="info" title={copy.packNote.title}>
            <p>{copy.packNote.text}</p>
          </Notice>
          <Notice tone="success" title={copy.noPurchase.title}>
            <p>
              {copy.noPurchase.text} <Link href="/grafismo-fonetico/">{copy.noPurchase.cta}</Link>
            </p>
          </Notice>
        </div>
      </section>
    </PageShell>
  );
}
