import { formatUsd } from "@config/commerce";
import { site } from "@config/site";
import { homeCopy as copy } from "@content/es/home";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { BulletList } from "@/components/ui/BulletList/BulletList";
import { Card } from "@/components/ui/Card/Card";
import { ChipRow } from "@/components/ui/ChipRow/ChipRow";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import { FactChip } from "@/components/ui/FactChip/FactChip";
import { Grid } from "@/components/ui/Grid/Grid";
import { IconCardList } from "@/components/ui/IconCardList/IconCardList";
import { MediaImage } from "@/components/ui/MediaImage/MediaImage";
import { Section } from "@/components/ui/Section/Section";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { SocialLinks } from "@/components/ui/SocialLinks/SocialLinks";
import { Stack } from "@/components/ui/Stack/Stack";
import { Steps } from "@/components/ui/Steps/Steps";
import { ProductInterestLink } from "@/features/commerce/ProductInterestLink/ProductInterestLink";
import { CenteredHeading } from "@/features/landing/core/CenteredHeading";
import { HeroScene } from "@/features/landing/core/HeroScene";
import { HeroStack } from "@/features/landing/core/HeroStack";
import { buildMetadata } from "@/lib/metadata";
import { FlipPreview } from "@/motion/FlipPreview";
import { Orbit } from "@/motion/Orbit";
import { featuredProduct } from "@/products";
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

const product = featuredProduct();
const price = formatUsd(product.pricing.list);
const pageAt = (index: number): string => product.media.pageIds[index] ?? product.media.hero;

/** Hero stack: the kit itself in front, two real pages fanned behind it. */
const HERO_STACK = [product.media.hero, pageAt(1), pageAt(4)] as const;
const HERO_STACK_SIZES =
  "(min-width: 1280px) 480px, (min-width: 1024px) 400px, (min-width: 640px) 360px, 240px";
/** Real pages of the flip cards: front and back of each. */
const PREVIEW_PAGES = [
  [pageAt(0), pageAt(1)],
  [pageAt(6), pageAt(7)],
  [pageAt(12), pageAt(13)],
] as const;
const PREVIEW_SIZES = "(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw";

function productLink(position: string, className: string, label: string, hash = "") {
  return (
    <ProductInterestLink
      href={`${product.path}${hash}`}
      product={product.slug}
      position={position}
      className={className}
    >
      {label}
    </ProductInterestLink>
  );
}

export default function HomePage() {
  const stackPages = HERO_STACK.map((id, index) => ({
    id,
    node: <MediaImage id={id} sizes={HERO_STACK_SIZES} priority={index === 0} />,
  }));

  return (
    <PageShell
      nav={copy.nav}
      cta={productLink("header", "button button--primary button--small", copy.hero.cta)}
    >
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from config
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <HeroScene
        id="hero"
        titleId="hero-title"
        eyebrow={copy.hero.kicker}
        title={copy.hero.title}
        lead={copy.hero.lead}
        stack={<HeroStack pages={stackPages} featured={0} />}
        aside={
          <Card variant="emphasis" pad="lg" as="article" className={styles.productCard}>
            <Eyebrow>{copy.product.kicker}</Eyebrow>
            <h2 className={styles.productTitle}>{copy.product.title}</h2>
            <p>{copy.product.promise}</p>
            <ChipRow>
              {copy.product.facts.map((fact) => (
                <Eyebrow key={fact} as="span">
                  {fact}
                </Eyebrow>
              ))}
            </ChipRow>
            <p className={styles.productPrice}>
              <span className={styles.productPriceKicker}>{copy.product.priceKicker}</span>
              <span>{price}</span>
            </p>
            {productLink("hero", "button button--primary button--block", `${copy.product.cta} · ${price}`)}
          </Card>
        }
        desk={
          <section id="empieza" className={styles.start} aria-labelledby="empieza-title">
            <SectionHeading
              id="empieza-title"
              kicker={copy.start.kicker}
              title={copy.start.title}
              lead={copy.start.lead}
            />
            <Stack gap={5}>
              <Card variant="emphasis" pad="lg" as="article" reveal>
                <Eyebrow>{copy.start.principal.label}</Eyebrow>
                <h3 className={styles.startTitle}>{copy.start.principal.title}</h3>
                <p>{copy.start.principal.text}</p>
                <BulletList items={copy.start.principal.points} icon="link" />
                <div>
                  {productLink("start", "button button--secondary button--small", copy.start.principal.cta)}
                </div>
              </Card>
              <Card variant="soft" pad="lg" as="article" reveal>
                <Eyebrow>{copy.start.complement.label}</Eyebrow>
                <h3 className={styles.startTitle}>{copy.start.complement.title}</h3>
                <p>{copy.start.complement.text}</p>
                <BulletList items={copy.start.complement.points} icon="link" />
              </Card>
            </Stack>
          </section>
        }
      >
        <ChipRow>
          {copy.hero.chips.map((chip) => (
            <FactChip key={chip.label} icon={chip.icon} label={chip.label} tone="dark" />
          ))}
        </ChipRow>
      </HeroScene>

      <Section tone="sky" id="paginas" labelledBy="preview-title" defer>
        <CenteredHeading
          id="preview-title"
          kicker={copy.preview.kicker}
          title={copy.preview.title}
          lead={copy.preview.lead}
        />
        <Grid cols={3} as="ul">
          {PREVIEW_PAGES.map(([front, back]) => (
            <li key={front}>
              <FlipPreview
                front={<MediaImage id={front} sizes={PREVIEW_SIZES} />}
                back={<MediaImage id={back} sizes={PREVIEW_SIZES} />}
                showLabel={copy.preview.flip.show}
                hideLabel={copy.preview.flip.hide}
              />
            </li>
          ))}
        </Grid>
        <p className={styles.previewCta}>
          {productLink("preview", "button button--secondary", copy.preview.cta, "#paginas")}
        </p>
      </Section>

      <Section
        tone="navy"
        id="metodo"
        labelledBy="metodo-title"
        divider="wave-top"
        dividerTone="sky"
        className={styles.band}
        defer
      >
        <div className={styles.bandOrbit} aria-hidden="true">
          <Orbit />
        </div>
        <div className={styles.bandInner}>
          <CenteredHeading
            id="metodo-title"
            kicker={copy.method.kicker}
            title={copy.method.title}
            lead={copy.method.lead}
            tone="dark"
          />
          <Steps steps={copy.method.steps} tone="dark" />
        </div>
      </Section>

      <Section id="valores" labelledBy="valores-title" defer>
        <SectionHeading id="valores-title" kicker={copy.values.kicker} title={copy.values.title} />
        <IconCardList items={copy.values.items} cols={3} />
      </Section>

      <Section tone="navy" labelledBy="cierre-title" className={styles.band} defer>
        <div className={styles.bandOrbit} aria-hidden="true">
          <Orbit />
        </div>
        <Stack gap={4} maxWidth="60ch" className={styles.bandInner}>
          <Eyebrow tone="dark">{copy.closing.kicker}</Eyebrow>
          <h2 id="cierre-title">{copy.closing.title}</h2>
          <p className="lead">{copy.closing.text}</p>
          <div className={styles.closingActions}>
            {productLink("closing", "button button--primary", copy.closing.cta)}
            <span className={styles.closingPrice}>
              {price} · {copy.closing.priceSuffix}
            </span>
          </div>
          <div className={styles.closingSocial}>
            <p>{copy.closing.social}</p>
            <SocialLinks tone="dark" showLabels />
          </div>
        </Stack>
      </Section>
    </PageShell>
  );
}
