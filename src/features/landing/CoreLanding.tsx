import { formatUsd, localCurrencyNoteShort } from "@config/commerce";
import { site } from "@config/site";
import type { ReactNode } from "react";
import { AssuranceList } from "@/components/blocks/assurance-list";
import { BulletList } from "@/components/blocks/bullet-list";
import { Eyebrow } from "@/components/blocks/eyebrow";
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
import { CreatorNote } from "@/features/landing/core/CreatorNote";
import { HeroScene } from "@/features/landing/core/HeroScene";
import { HeroStack } from "@/features/landing/core/HeroStack";
import { Includes } from "@/features/landing/core/Includes";
import { MethodSteps } from "@/features/landing/core/MethodSteps";
import { OfferCard } from "@/features/landing/core/OfferCard";
import { getImage, getVideo } from "@/lib/media";
import { Parallax } from "@/motion/parallax";
import { StickyCTA } from "@/motion/sticky-cta";
import { Universe } from "@/motion/universe";
import { checkoutFallbackPath } from "@/products";
import { breadcrumbJsonLd, productJsonLd } from "@/products/jsonld";
import type { CoreProduct } from "@/products/schema";

type Props = { product: CoreProduct };

/** Positions in `media.pageIds` of the hero worksheets, one per age option (3–4 · 5 · 6–7). */
const HERO_STACK_PAGES = [6, 1, 12] as const;
const HERO_STACK_SIZES =
  "(min-width: 1280px) 480px, (min-width: 1024px) 400px, (min-width: 640px) 360px, 272px";
const SCENE_SIZES = "(min-width: 1024px) 520px, 92vw";
/** Price-card CTA: tighter padding and no leading icon when the card (its container) is narrow. */
const CTA = `${buttonVariants()} @max-[24rem]:px-4 @max-[24rem]:[&_svg[data-icon=inline-start]]:hidden`;
const CTA_HERO = `${buttonVariants({ size: "lg" })} w-full cq-sm:w-auto`;

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

/** Full CTA label, or the sticky bar's short one when the enclosing container is narrow. */
const LABEL = {
  /** Price cards (the card itself is the container): short under 26rem. */
  card: ["@max-[26rem]:hidden", "hidden @max-[26rem]:inline"],
  /** The full-width hero CTA (the hero is the container): short under 22rem. */
  hero: ["@max-[22rem]:hidden", "hidden @max-[22rem]:inline"],
} as const;

/** CTA label that never wraps at ≥ 320 px. */
function ctaLabel(full: string, short: string, fit: keyof typeof LABEL = "card"): ReactNode {
  const [long, compact] = LABEL[fit];
  return (
    <>
      <span className={long}>{full}</span>
      <span className={compact}>{short}</span>
    </>
  );
}

function captionFor(id: string): string {
  return getImage(id).alt.replace(/^Página real \d+: /i, "");
}

/**
 * Principal product landing in conversion order: hero (H1, age-aware real worksheets, CTA with
 * its assurances, the sticky price card) → what you receive → the problem → the method → videos
 * → real pages → the offer → who it is for → author's note → FAQ → final offer, plus the mobile
 * sticky bar. Bands are joined by waves and one overlap; navy bands carry the static universe.
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
  const labels = copy.included.bundle;
  const bonusCount = product.resources.length - 1;
  const bundle = labels
    ? {
        line: `${labels.main} + ${bonusCount} ${labels.bonuses}`,
        badges: product.resources.map((_, index) =>
          index === 0
            ? { label: labels.main, tone: "gold" as const }
            : { label: `${labels.bonus} ${index} · ${labels.included}` },
        ),
        allIncluded: `${labels.allIncluded} ${formatUsd(price)}.`,
      }
    : undefined;
  const withBundle = (checks: readonly string[]) => (bundle ? [bundle.line, ...checks] : checks);
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
            <CheckoutLink product={target} position="hero" className={CTA_HERO}>
              {ctaLabel(copy.hero.cta, copy.sticky.cta, "hero")}
            </CheckoutLink>
          }
          trust={
            assurance ? (
              <AssuranceList
                items={[
                  { icon: "shield", text: `${assurance.payment} · ${formatUsd(price)}` },
                  { icon: "download", text: assurance.access },
                  { icon: "refresh", text: assurance.guarantee },
                ]}
              />
            ) : null
          }
          stack={<HeroStack pages={stackPages} featured={defaultAge} />}
          aside={
            <div className="grid gap-5">
              <PriceBlock
                id="comprar"
                kicker={copy.hero.priceKicker}
                price={price}
                taxNote={copy.hero.taxNote}
                cta={
                  <CheckoutLink product={target} position="hero-card" className={CTA}>
                    {ctaLabel(copy.hero.cta, copy.sticky.cta)}
                  </CheckoutLink>
                }
                ctaNote={copy.hero.ctaNote}
                className="cq scroll-mt-(--header-height) border-2 border-navy p-6 shadow-lg sm:p-8"
              />
              {bundle ? (
                <p className="text-center font-extrabold text-balance text-ink">{bundle.allIncluded}</p>
              ) : null}
              <AssuranceList items={copy.trust} layout="stack" className="px-2 font-semibold" />
            </div>
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
              bundle={bundle}
            />
          }
        >
          {ages ? <AgeSelector legend={ages.legend} options={ages.items} initial={defaultAge} /> : null}
        </HeroScene>
      </AgeProvider>

      <Section tone="white" labelledBy="problema-title" divider="wave-top" dividerTone="cream" defer>
        <Split ratio="1.1/0.9" align="center">
          <Stack gap={4}>
            <Eyebrow>{copy.problem.kicker}</Eyebrow>
            <h2 id="problema-title">{copy.problem.title}</h2>
            {copy.problem.paragraphs.map((paragraph) => (
              <p key={paragraph} className="lead max-w-[62ch] text-pretty">
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
        <div className="mt-16 grid gap-8">
          <IconCardList items={copy.benefits.items} cols={4} />
          <p
            className="max-w-[60ch] justify-self-center rounded-md border-l-4 border-gold bg-cream px-8 py-6 text-center font-display text-h3 text-balance text-ink"
            data-reveal=""
          >
            {copy.benefits.callout}
          </p>
        </div>
      </Section>

      <Section
        tone="navy"
        id="metodo"
        labelledBy="metodo-title"
        divider="wave-top"
        dividerTone="white"
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
        <MethodSteps steps={copy.method.steps} />
        <Card variant="navy" pad="lg" className="mt-16 bg-navy-deep/80" reveal>
          <Split ratio="0.9/1.1" align="center">
            <Stack gap={3}>
              <Eyebrow>{copy.credibility.kicker}</Eyebrow>
              <h3 className="font-display text-h2">{copy.credibility.title}</h3>
              <p className="text-pretty">{copy.credibility.text}</p>
            </Stack>
            <BulletList items={copy.credibility.points} icon="link" tone="dark" />
          </Split>
        </Card>
      </Section>

      <Section id="videos" labelledBy="videos-title" divider="wave-top" dividerTone="navy-deep" defer>
        <SectionHeading
          id="videos-title"
          kicker={copy.videos.kicker}
          title={copy.videos.title}
          lead={copy.videos.lead}
          align="center"
        />
        <VideoBlock items={videos} illustrativeLabel={copy.videos.illustrative} />
      </Section>

      <Section
        tone="sky"
        id="paginas"
        labelledBy="paginas-title"
        divider="wave-top"
        dividerTone="cream"
        className="pb-[calc(var(--section-pad)+var(--section-overlap))]"
      >
        <SectionHeading
          id="paginas-title"
          kicker={copy.pages.kicker}
          title={copy.pages.title}
          lead={copy.pages.lead}
          align="center"
        />
        <PageGallery
          count={media.pageIds.length}
          label={copy.pages.galleryLabel}
          itemLabel={copy.pages.itemLabel}
          zoomTitle={copy.pages.zoomTitle}
          zoomHint={copy.pages.zoomHint}
        >
          {media.pageIds.map((id) => (
            <GallerySlide key={id} id={id} caption={captionFor(id)} />
          ))}
        </PageGallery>
      </Section>

      <Section id="oferta" labelledBy="oferta-title" divider="overlap">
        <OfferCard
          titleId="oferta-title"
          kicker={copy.offer?.kicker ?? copy.hero.priceKicker}
          title={copy.midOffer.title}
          text={copy.midOffer.text}
          checks={withBundle(copy.offer?.checks ?? copy.finalOffer.checks)}
          highlight={bundle?.allIncluded}
          price={{
            kicker: copy.hero.priceKicker,
            value: price,
            taxNote: copy.hero.taxNote,
          }}
          cta={
            <CheckoutLink product={target} position="oferta" className={CTA}>
              {ctaLabel(copy.midOffer.cta, copy.sticky.cta)}
            </CheckoutLink>
          }
          footer={<AssuranceList items={copy.trust} className="justify-center border-t border-border pt-6" />}
        />
      </Section>

      {copy.audience ? (
        <Section tone="white" id="para-quien" labelledBy="audience-title" defer>
          <SectionHeading
            id="audience-title"
            kicker={copy.audience.kicker}
            title={copy.audience.title}
            align="center"
          />
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
          <Stack gap={3} className="cq-md:sticky cq-md:top-[calc(var(--header-height)+1.5rem)]">
            <SectionHeading id="faq-title" kicker={copy.faq.kicker} title={copy.faq.title} className="mb-0" />
            <p className="text-small">
              {copy.faq.supportNote} <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
            </p>
          </Stack>
          <FAQ items={copy.faq.items} />
        </Split>
      </Section>

      <Section
        tone="navy"
        id="oferta-final"
        labelledBy="final-title"
        divider="wave-top"
        dividerTone="mint"
        backdrop={<Universe variant="band" />}
        className="scroll-mt-(--header-height)"
        defer
      >
        <Split ratio="1.1/0.9" align="center">
          <Stack gap={5}>
            <Eyebrow>{copy.finalOffer.kicker}</Eyebrow>
            <h2 id="final-title" className="max-w-[18ch]">
              {copy.finalOffer.title}
            </h2>
            <BulletList items={withBundle(copy.finalOffer.checks)} icon="shield" tone="dark" />
          </Stack>
          <PriceBlock
            kicker={copy.hero.priceKicker}
            price={price}
            taxNote={copy.hero.taxNote}
            cta={
              <CheckoutLink product={target} position="final" className={CTA}>
                {ctaLabel(copy.finalOffer.cta, copy.sticky.cta)}
              </CheckoutLink>
            }
            ctaNote={copy.finalOffer.note}
            className="cq border-2 border-navy p-6 shadow-lg sm:p-8"
          />
        </Split>
      </Section>

      <StickyCTA
        hideWhenVisible={['a[data-position="hero"]', "#comprar", "#oferta", "#oferta-final", "footer"]}
        label={`${copy.sticky.label} · ${formatUsd(price)}`}
        note={localCurrencyNoteShort}
      >
        <CheckoutLink product={target} position="sticky" className={CTA}>
          {copy.sticky.cta}
        </CheckoutLink>
      </StickyCTA>
    </PageShell>
  );
}
