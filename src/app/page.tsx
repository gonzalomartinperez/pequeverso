import { formatUsd, localCurrencyNote, localCurrencyNoteShort } from "@config/commerce";
import { site } from "@config/site";
import { homeCopy as copy } from "@content/es/home";
import type { Metadata } from "next";
import { AssuranceList } from "@/components/blocks/assurance-list";
import { BulletList } from "@/components/blocks/bullet-list";
import { ChipRow } from "@/components/blocks/chip-row";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { FactChip } from "@/components/blocks/fact-chip";
import { Grid } from "@/components/blocks/grid";
import { Icon } from "@/components/blocks/icon";
import { IconCardList } from "@/components/blocks/icon-card-list";
import { MediaImage } from "@/components/blocks/media-image";
import { Section } from "@/components/blocks/section";
import { SectionHeading } from "@/components/blocks/section-heading";
import { SocialLinks } from "@/components/blocks/social-links";
import { Stack } from "@/components/blocks/stack";
import { Steps } from "@/components/blocks/steps";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card } from "@/components/ui/card";
import { ProductInterestLink } from "@/features/commerce/ProductInterestLink/ProductInterestLink";
import { HeroScene } from "@/features/landing/core/HeroScene";
import { HeroStack } from "@/features/landing/core/HeroStack";
import { buildMetadata } from "@/lib/metadata";
import { FlipPreview } from "@/motion/flip-preview";
import { Universe } from "@/motion/universe";
import { featuredProduct } from "@/products";

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
  "(min-width: 1280px) 480px, (min-width: 1024px) 400px, (min-width: 640px) 360px, 272px";
/** Real pages of the flip cards: front and back of each. */
const PREVIEW_PAGES = [
  [pageAt(0), pageAt(1)],
  [pageAt(6), pageAt(7)],
  [pageAt(12), pageAt(13)],
] as const;
const PREVIEW_SIZES = "(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw";
/** Home links lead to the product page, not to payment: white/navy buttons, never the coral CTA. */
const LINK_HERO = `${buttonVariants({ variant: "inverse", size: "lg" })} w-full cq-sm:w-auto`;
const LINK_CARD = buttonVariants({ variant: "secondary", block: true });
const START_TITLE = "font-display text-h3 font-bold";

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

/**
 * Hub: the universe hero (H1, value, real pages, one action), the product card with its price and
 * assurances, where to start, real pages, the method, what to expect and a closing band.
 */
export default function HomePage() {
  const stackPages = HERO_STACK.map((id, index) => ({
    id,
    node: <MediaImage id={id} sizes={HERO_STACK_SIZES} priority={index === 0} />,
  }));

  return (
    <PageShell
      nav={copy.nav}
      cta={productLink("header", buttonVariants({ variant: "secondary", size: "sm" }), copy.hero.cta)}
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
        actions={productLink("hero", LINK_HERO, copy.hero.cta)}
        stack={<HeroStack pages={stackPages} featured={0} />}
        aside={
          <Card variant="emphasis" pad="lg" as="article" className="gap-4 shadow-lg">
            <Eyebrow>{copy.product.kicker}</Eyebrow>
            <h2 className="text-h2">{copy.product.title}</h2>
            <p className="text-pretty">{copy.product.promise}</p>
            <ChipRow>
              {copy.product.facts.map((fact) => (
                <Eyebrow key={fact} as="span" className="bg-sky">
                  {fact}
                </Eyebrow>
              ))}
            </ChipRow>
            <p className="mt-2 grid font-display text-price font-bold text-coral">
              <span className="font-sans text-tiny font-extrabold tracking-[0.06em] text-subtle uppercase">
                {copy.product.priceKicker}
              </span>
              <span>{price}</span>
            </p>
            <p className="flex items-start gap-2 text-small text-pretty text-subtle">
              <Icon name="globe" size={16} className="mt-[0.2em] shrink-0 text-teal-text" />
              <span>{localCurrencyNote}</span>
            </p>
            {productLink("hero-card", LINK_CARD, `${copy.product.cta} · ${price}`)}
            <AssuranceList items={copy.product.assurance} />
          </Card>
        }
        desk={
          <section id="empieza" className="scroll-mt-(--header-height)" aria-labelledby="empieza-title">
            <SectionHeading
              id="empieza-title"
              kicker={copy.start.kicker}
              title={copy.start.title}
              lead={copy.start.lead}
            />
            <Stack gap={5}>
              <Card variant="emphasis" pad="lg" as="article" reveal>
                <Eyebrow>{copy.start.principal.label}</Eyebrow>
                <h3 className={START_TITLE}>{copy.start.principal.title}</h3>
                <p>{copy.start.principal.text}</p>
                <BulletList items={copy.start.principal.points} icon="link" />
                <div>
                  {productLink(
                    "start",
                    buttonVariants({ variant: "outline", size: "sm" }),
                    copy.start.principal.cta,
                  )}
                </div>
              </Card>
              <Card variant="soft" pad="lg" as="article" reveal stagger={1}>
                <Eyebrow>{copy.start.complement.label}</Eyebrow>
                <h3 className={START_TITLE}>{copy.start.complement.title}</h3>
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

      <Section
        tone="sky"
        id="paginas"
        labelledBy="preview-title"
        divider="wave-top"
        dividerTone="cream"
        defer
      >
        <SectionHeading
          id="preview-title"
          kicker={copy.preview.kicker}
          title={copy.preview.title}
          lead={copy.preview.lead}
          align="center"
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
        <p className="mt-10 flex justify-center">
          {productLink("preview", buttonVariants({ variant: "outline" }), copy.preview.cta, "#paginas")}
        </p>
      </Section>

      <Section
        tone="navy"
        id="metodo"
        labelledBy="metodo-title"
        divider="wave-top"
        dividerTone="sky"
        backdrop={<Universe variant="band" />}
        defer
      >
        <SectionHeading
          id="metodo-title"
          kicker={copy.method.kicker}
          title={copy.method.title}
          lead={copy.method.lead}
          align="center"
        />
        <Steps steps={copy.method.steps} tone="dark" />
      </Section>

      <Section id="valores" labelledBy="valores-title" divider="wave-top" dividerTone="navy-deep" defer>
        <SectionHeading
          id="valores-title"
          kicker={copy.values.kicker}
          title={copy.values.title}
          align="center"
        />
        <IconCardList items={copy.values.items} cols={3} />
      </Section>

      <Section
        tone="navy"
        labelledBy="cierre-title"
        divider="wave-top"
        dividerTone="cream"
        backdrop={<Universe variant="band" />}
        defer
      >
        <Stack gap={5} maxWidth="60ch" align="center">
          <Eyebrow>{copy.closing.kicker}</Eyebrow>
          <h2 id="cierre-title">{copy.closing.title}</h2>
          <p className="lead text-pretty">{copy.closing.text}</p>
          <div className="grid justify-items-center gap-3">
            {productLink("closing", buttonVariants({ variant: "inverse", size: "lg" }), copy.closing.cta)}
            <p className="grid font-extrabold text-gold">
              <span>
                {price} · {copy.closing.priceSuffix}
              </span>
              <span className="text-small font-semibold text-body">{localCurrencyNoteShort}</span>
            </p>
          </div>
          <div className="mt-4 grid w-full justify-items-center gap-3 border-t border-border pt-8">
            <p className="text-small">{copy.closing.social}</p>
            <SocialLinks tone="dark" />
          </div>
        </Stack>
      </Section>
    </PageShell>
  );
}
