import { formatUsd, localCurrencyNoteShort } from "@config/commerce";
import { site } from "@config/site";
import { BulletList } from "@/components/blocks/bullet-list";
import { ChipRow } from "@/components/blocks/chip-row";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { FactChip } from "@/components/blocks/fact-chip";
import { FAQ } from "@/components/blocks/faq";
import { IconCardList } from "@/components/blocks/icon-card-list";
import { MediaFrame } from "@/components/blocks/media-frame";
import { MediaImage } from "@/components/blocks/media-image";
import { PriceBlock } from "@/components/blocks/price-block";
import { Section } from "@/components/blocks/section";
import { SectionHeading } from "@/components/blocks/section-heading";
import { Split } from "@/components/blocks/split";
import { Stack } from "@/components/blocks/stack";
import { Topbar } from "@/components/blocks/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card } from "@/components/ui/card";
import { CheckoutLink, type CheckoutTarget } from "@/features/commerce/CheckoutLink/CheckoutLink";
import { ViewContentOnMount } from "@/features/commerce/ViewContentOnMount/ViewContentOnMount";
import { GallerySlide } from "@/features/gallery/PageGallery/GallerySlide";
import { PageGallery } from "@/features/gallery/PageGallery/PageGallery";
import { VideoBlock } from "@/features/gallery/VideoBlock/VideoBlock";
import { AgeProvider } from "@/features/landing/AgeSelector/AgeContext";
import { AgeSelector } from "@/features/landing/AgeSelector/AgeSelector";
import { AudienceCards } from "@/features/landing/core/AudienceCards";
import { CenteredHeading } from "@/features/landing/core/CenteredHeading";
import { CreatorNote } from "@/features/landing/core/CreatorNote";
import { HeroScene } from "@/features/landing/core/HeroScene";
import { HeroStack } from "@/features/landing/core/HeroStack";
import { Includes } from "@/features/landing/core/Includes";
import { MethodSteps } from "@/features/landing/core/MethodSteps";
import { OfferCard } from "@/features/landing/core/OfferCard";
import { getImage, getVideo } from "@/lib/media";
import { Orbit } from "@/motion/orbit";
import { Parallax } from "@/motion/parallax";
import { StickyCTA } from "@/motion/sticky-cta";
import { checkoutFallbackPath } from "@/products";
import { breadcrumbJsonLd, productJsonLd } from "@/products/jsonld";
import type { CoreProduct } from "@/products/schema";
import styles from "./CoreLanding.module.css";

type Props = { product: CoreProduct };

/** Positions in `media.pageIds` of the hero worksheets, one per age option (3–4 · 5 · 6–7). */
const HERO_STACK_PAGES = [6, 1, 12] as const;
const HERO_STACK_SIZES =
  "(min-width: 1280px) 480px, (min-width: 1024px) 400px, (min-width: 640px) 360px, 240px";
const SCENE_SIZES = "(min-width: 1024px) 520px, 92vw";

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

function captionFor(id: string): string {
  return getImage(id).alt.replace(/^Página real \d+: /i, "");
}

/**
 * Principal product landing in conversion order: hero with the age-aware worksheet stack and the
 * price card, what you receive, the problem, the method, videos, real pages, the offer, who it is
 * for, the author's note, FAQ and the final offer, plus the mobile sticky bar.
 */
export function CoreLanding({ product }: Props) {
  const { copy, media, composition } = product;
  const price = product.pricing.list;
  const target = checkoutTarget(product);
  const ages = copy.hero.ages;
  const defaultAge = ages
    ? Math.max(
        0,
        ages.items.findIndex((item) => item.id === ages.defaultId),
      )
    : 0;
  const stackPages = HERO_STACK_PAGES.map((position, index) => {
    const id = media.pageIds[position] ?? media.hero;
    return { id, node: <MediaImage id={id} sizes={HERO_STACK_SIZES} priority={index === defaultAge} /> };
  });
  const assurance = copy.hero.assurance;
  const trustLine = assurance
    ? [assurance.payment, formatUsd(price), assurance.access, assurance.guarantee].join(" · ")
    : undefined;
  const videos = media.videoIds.map((id) => getVideo(id));

  const headerCta = (
    <CheckoutLink
      product={target}
      position="header"
      className={buttonVariants({ size: "sm" })}
      title={localCurrencyNoteShort}
    >
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

      <AgeProvider initial={defaultAge}>
        <HeroScene
          id="hero"
          titleId="hero-title"
          eyebrow={copy.hero.kicker}
          title={copy.hero.title}
          lead={copy.hero.lead}
          actions={
            <CheckoutLink product={target} position="hero" className={buttonVariants()}>
              {copy.hero.cta}
            </CheckoutLink>
          }
          trust={trustLine}
          stack={<HeroStack pages={stackPages} featured={defaultAge} />}
          aside={
            <PriceBlock
              id="comprar"
              kicker={copy.hero.priceKicker}
              price={price}
              taxNote={copy.hero.taxNote}
              cta={
                <CheckoutLink product={target} position="hero-card" className={buttonVariants()}>
                  {copy.hero.cta}
                </CheckoutLink>
              }
              ctaNote={copy.hero.ctaNote}
            />
          }
          desk={
            <Includes
              id="incluye"
              titleId="incluye-title"
              kicker={copy.included.kicker}
              title={copy.included.title}
              lead={copy.included.lead}
              total={copy.included.total}
              counts={{ pdf: composition.pdfCount, pages: composition.pageCount }}
              units={copy.included.units}
              resources={product.resources}
            />
          }
        >
          {ages ? <AgeSelector legend={ages.legend} options={ages.items} initial={defaultAge} /> : null}
        </HeroScene>
      </AgeProvider>

      <Section tone="white" labelledBy="problema-title" defer>
        <Split ratio="1.1/0.9" align="center">
          <Stack gap={4}>
            <Eyebrow>{copy.problem.kicker}</Eyebrow>
            <h2 id="problema-title">{copy.problem.title}</h2>
            {copy.problem.paragraphs.map((paragraph) => (
              <p key={paragraph} className="lead">
                {paragraph}
              </p>
            ))}
            <BulletList items={copy.problem.bullets} icon="star" />
          </Stack>
          <Parallax>
            <MediaFrame elevation="lg" tilt as="figure">
              <MediaImage id={media.scenes.problem} sizes={SCENE_SIZES} />
            </MediaFrame>
          </Parallax>
        </Split>
        <div className={styles.benefits}>
          <IconCardList items={copy.benefits.items} cols={4} />
          <p className={styles.callout} data-reveal>
            {copy.benefits.callout}
          </p>
        </div>
      </Section>

      <Section tone="navy" id="metodo" labelledBy="metodo-title" divider="wave-top" dividerTone="white" defer>
        <CenteredHeading
          id="metodo-title"
          kicker={copy.method.kicker}
          title={copy.method.title}
          lead={copy.method.lead}
          tone="dark"
        />
        <MethodSteps steps={copy.method.steps} />
        <Card variant="navy" pad="lg" className={styles.approach} reveal>
          <Split ratio="0.9/1.1" align="center">
            <Stack gap={3}>
              <Eyebrow tone="dark">{copy.credibility.kicker}</Eyebrow>
              <h3>{copy.credibility.title}</h3>
              <p>{copy.credibility.text}</p>
            </Stack>
            <BulletList items={copy.credibility.points} icon="link" tone="dark" />
          </Split>
        </Card>
      </Section>

      <Section id="videos" labelledBy="videos-title" defer>
        <CenteredHeading
          id="videos-title"
          kicker={copy.videos.kicker}
          title={copy.videos.title}
          lead={copy.videos.lead}
        />
        <VideoBlock items={videos} />
      </Section>

      <Section tone="sky" id="paginas" labelledBy="paginas-title" divider="overlap">
        <CenteredHeading
          id="paginas-title"
          kicker={copy.pages.kicker}
          title={copy.pages.title}
          lead={copy.pages.lead}
        />
        <PageGallery
          count={media.pageIds.length}
          label={copy.pages.galleryLabel}
          zoomHint={copy.pages.zoomHint}
        >
          {media.pageIds.map((id) => (
            <GallerySlide key={id} id={id} caption={captionFor(id)} />
          ))}
        </PageGallery>
      </Section>

      <Section id="oferta" labelledBy="oferta-title" defer>
        <OfferCard
          titleId="oferta-title"
          kicker={copy.offer?.kicker ?? copy.hero.priceKicker}
          title={copy.midOffer.title}
          text={copy.midOffer.text}
          checks={copy.offer?.checks ?? copy.finalOffer.checks}
          price={{
            kicker: copy.hero.priceKicker,
            value: price,
            taxNote: copy.hero.taxNote,
          }}
          cta={
            <CheckoutLink product={target} position="oferta" className={buttonVariants()}>
              {copy.midOffer.cta}
            </CheckoutLink>
          }
        />
        <ChipRow align="center" className={styles.trust}>
          {copy.trust.map((item) => (
            <FactChip key={item.text} icon={item.icon} label={item.text} />
          ))}
        </ChipRow>
      </Section>

      {copy.audience ? (
        <Section tone="white" id="para-quien" labelledBy="audience-title" defer>
          <SectionHeading id="audience-title" kicker={copy.audience.kicker} title={copy.audience.title} />
          <AudienceCards yes={copy.audience.yes} no={copy.audience.no} />
        </Section>
      ) : null}

      {copy.creator?.enabled ? (
        <Section tone="lemon" labelledBy="creator-title" defer>
          <CreatorNote
            titleId="creator-title"
            kicker={copy.creator.kicker}
            title={copy.creator.title}
            paragraphs={copy.creator.paragraphs}
            signature={copy.creator.signature}
          />
        </Section>
      ) : null}

      <Section tone="mint" id="preguntas" labelledBy="faq-title" defer>
        <Split ratio="0.8/1.2">
          <Stack gap={3}>
            <SectionHeading id="faq-title" kicker={copy.faq.kicker} title={copy.faq.title} />
            <p className={styles.support}>
              {copy.faq.supportNote} <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
            </p>
          </Stack>
          <FAQ items={copy.faq.items} />
        </Split>
      </Section>

      <Section tone="navy" id="oferta-final" labelledBy="final-title" className={styles.final} defer>
        <div className={styles.finalOrbit} aria-hidden="true">
          <Orbit />
        </div>
        <Split ratio="1.1/0.9" align="center" className={styles.finalInner}>
          <Stack gap={4}>
            <Eyebrow tone="dark">{copy.finalOffer.kicker}</Eyebrow>
            <h2 id="final-title">{copy.finalOffer.title}</h2>
            <BulletList items={copy.finalOffer.checks} icon="shield" tone="dark" />
          </Stack>
          <PriceBlock
            kicker={copy.hero.priceKicker}
            price={price}
            taxNote={copy.hero.taxNote}
            tone="dark"
            cta={
              <CheckoutLink product={target} position="final" className={buttonVariants()}>
                {copy.finalOffer.cta}
              </CheckoutLink>
            }
            ctaNote={copy.finalOffer.note}
          />
        </Split>
      </Section>

      <StickyCTA
        hideWhenVisible={['a[data-position="hero"]', "#comprar", "#oferta", "#oferta-final", "footer"]}
        label={`${copy.sticky.label} · ${formatUsd(price)}`}
        note={localCurrencyNoteShort}
      >
        <CheckoutLink product={target} position="sticky" className={buttonVariants()}>
          {copy.sticky.cta}
        </CheckoutLink>
      </StickyCTA>
    </PageShell>
  );
}
