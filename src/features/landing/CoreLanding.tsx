import { formatUsd, localCurrencyNoteShort } from "@config/commerce";
import { site } from "@config/site";
import type { CSSProperties, ReactNode } from "react";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { FAQ } from "@/components/blocks/faq";
import { Icon, type IconName } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { Section } from "@/components/blocks/section";
import { SectionHeading } from "@/components/blocks/section-heading";
import { Topbar } from "@/components/blocks/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button-variants";
import { CheckoutLink, type CheckoutTarget } from "@/features/commerce/CheckoutLink/CheckoutLink";
import { ViewContentOnMount } from "@/features/commerce/ViewContentOnMount/ViewContentOnMount";
import { GallerySlide } from "@/features/gallery/PageGallery/GallerySlide";
import { PageGallery } from "@/features/gallery/PageGallery/PageGallery";
import { PageWall } from "@/features/gallery/PageWall/page-wall";
import { VideoBlock } from "@/features/gallery/VideoBlock/VideoBlock";
import { AgeProvider } from "@/features/landing/AgeSelector/AgeContext";
import { AgeSelector } from "@/features/landing/AgeSelector/AgeSelector";
import { AudienceCards } from "@/features/landing/core/AudienceCards";
import { BuyBox } from "@/features/landing/core/BuyBox";
import { CreatorNote } from "@/features/landing/core/CreatorNote";
import { FinalOffer } from "@/features/landing/core/FinalOffer";
import { HeroComposition } from "@/features/landing/core/HeroComposition";
import { HeroStack } from "@/features/landing/core/HeroStack";
import { Includes } from "@/features/landing/core/Includes";
import { MethodSteps } from "@/features/landing/core/MethodSteps";
import { OfferCard } from "@/features/landing/core/OfferCard";
import { PlaygroundCard } from "@/features/landing/core/PlaygroundCard";
import { type GallerySlideItem, ProductGallery } from "@/features/landing/core/ProductGallery";
import { ProductHero } from "@/features/landing/core/ProductHero";
import { Accent, Arc, Blend, Photo, SyllableTile } from "@/features/landing/core/parts";
import { SyllablePlayground } from "@/features/playground/syllable-playground";
import { getImage, getVideo } from "@/lib/media";
import { Marquee } from "@/motion/marquee";
import { StickyCTA } from "@/motion/sticky-cta";
import { Universe } from "@/motion/universe";
import { checkoutFallbackPath } from "@/products";
import { breadcrumbJsonLd, productJsonLd } from "@/products/jsonld";
import type { CoreProduct } from "@/products/schema";

type Props = { product: CoreProduct };

/** Positions in `media.pageIds` of the hero worksheets, one per age option (3–4 · 5 · 6–7). */
const HERO_STACK_PAGES = [6, 1, 12] as const;
const HERO_STACK_SIZES = "(min-width: 1024px) 280px, 42vw";
/**
 * Visual slots of the landing (manifest ids). Transparent cut-outs and AI lifestyle scenes are
 * illustrative (see `media/manifest.json`); real worksheets come from `media.pageIds`.
 */
const VISUAL = {
  heroCutout: "gf.cutout.hero",
  kit: "gf.cutout.kit",
  stack: "gf.cutout.stack",
  tablet: "gf.cutout.tablet",
  playground: "gf.cutout.tarjetas",
  pointer: "gf.cutout.senala",
  closing: "gf.cutout.celebra",
  life: {
    kit: "gf.life.kit",
    print: "gf.life.imprimir-kit",
    routine: "gf.life.noche",
    proud: "gf.life.reto",
    editorial: "gf.life.trazo",
    flatlay: "gf.life.flatlay",
    family: "gf.life.papa",
  },
} as const;
/** Real worksheets shown as gallery slides (page numbers of `gf.page.NN`). */
const GALLERY_PAGES = [18, 7] as const;
const GALLERY_SIZES = "(min-width: 1024px) 620px, 92vw";
const THUMB_SIZES = "96px";
const CTA_BUY = `${buttonVariants({ size: "xl" })} w-full @max-[26rem]:text-[1.0625rem] @max-[22rem]:px-4 @max-[22rem]:[&_svg[data-icon=inline-start]]:hidden`;
/** Price-card CTA: tighter padding and no leading icon when the card (its container) is narrow. */
const CTA = `${buttonVariants()} @max-[24rem]:px-4 @max-[24rem]:[&_svg[data-icon=inline-start]]:hidden`;
const CTA_FINAL = `${buttonVariants({ size: "lg" })} w-full cq-sm:w-auto`;

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
  /** Full-width CTAs of the buy box and the closing band: short under 22rem. */
  wide: ["@max-[19rem]:hidden", "hidden @max-[19rem]:inline"],
  /** The closing band's CTA (the band is the container): short under 22rem. */
  band: ["@max-[22rem]:hidden", "hidden @max-[22rem]:inline"],
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

const pageId = (pageIds: readonly string[], page: number): string => pageIds[page - 1] ?? pageIds[0] ?? "";

/** A slide frame of the product gallery (square from md, a little shorter on phones). */
const SLIDE = "grid aspect-[10/9] place-items-center @min-[30rem]:aspect-square";

function CutoutSlide({ id }: { id: string }) {
  return (
    <div
      className={`${SLIDE} p-[6%] [&_img]:h-auto [&_img]:max-h-full [&_img]:w-full [&_img]:object-contain [&_picture]:contents`}
    >
      <MediaImage id={id} sizes={GALLERY_SIZES} />
    </div>
  );
}

function PageSlide({ id }: { id: string }) {
  return (
    <div className={`${SLIDE} p-[9%]`}>
      <div className="-rotate-2 rounded-lg bg-white p-2 shadow-float [&_img]:h-auto [&_img]:w-full [&_img]:rounded-md [&_img]:object-contain [&_picture]:contents">
        <MediaImage id={id} sizes={GALLERY_SIZES} />
      </div>
    </div>
  );
}

function Thumb({ id }: { id: string }) {
  return <MediaImage id={id} sizes={THUMB_SIZES} alt="" />;
}

/**
 * Principal product landing as a modern product page: the PDP hero (gallery + buy box with the
 * age variant) → facts → everything included → the problem and benefits → the method with the
 * playground → real pages → videos → the offer → who it is for → FAQ → the closing band, plus the
 * mobile sticky bar. Navy frames the top, the method and the close; everything else reads on
 * light gradients.
 */
export function CoreLanding({ product }: Props) {
  const { copy, media, composition } = product;
  const price = product.pricing.list;
  const target = checkoutTarget(product);
  const ages = copy.hero.ages;
  const pdp = copy.hero.pdp;
  const caption = copy.illustrativeImage;
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
  const bundleLine = labels ? `${labels.main} + ${bonusCount} ${labels.bonuses}` : undefined;
  const allIncluded = labels ? `${labels.allIncluded} ${formatUsd(price)}.` : undefined;
  const withBundle = (checks: readonly string[]) => (bundleLine ? [bundleLine, ...checks] : checks);
  const videos = media.videoIds.map((id) => getVideo(id));
  const units = copy.included.units ?? { pdf: "PDF", pages: "páginas" };
  const factText = (item: { text: string; fact?: "pdf" | "pages" | "ages" }): string => {
    if (item.fact === "pdf") return `${composition.pdfCount} ${item.text}`;
    if (item.fact === "pages") return `${composition.pageCount} ${item.text}`;
    if (item.fact === "ages") return [composition.ageRange, item.text].filter(Boolean).join(" ");
    return item.text;
  };

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

  const gallerySlides: GallerySlideItem[] = pdp
    ? [
        {
          id: VISUAL.heroCutout,
          label: pdp.slides[0] ?? "",
          node: (
            <HeroComposition
              cutout={VISUAL.heroCutout}
              sizes="(min-width: 1024px) 360px, 56vw"
              stack={
                <HeroStack
                  pages={stackPages}
                  featured={defaultAge}
                  layout="orbit"
                  labels={ages?.items.map((item) => pdp.featuredLabel.replace("{age}", item.label))}
                />
              }
            />
          ),
          thumb: <Thumb id={VISUAL.heroCutout} />,
        },
        {
          id: VISUAL.life.kit,
          label: pdp.slides[1] ?? "",
          node: (
            <div className={SLIDE}>
              <Photo
                id={VISUAL.life.kit}
                sizes={GALLERY_SIZES}
                caption={caption}
                className="size-full rounded-none shadow-none"
              />
            </div>
          ),
          thumb: <Thumb id={VISUAL.life.kit} />,
        },
        {
          id: VISUAL.kit,
          label: pdp.slides[2] ?? "",
          node: <CutoutSlide id={VISUAL.kit} />,
          thumb: <Thumb id={VISUAL.kit} />,
        },
        {
          id: pageId(media.pageIds, GALLERY_PAGES[0]),
          label: pdp.slides[3] ?? "",
          node: <PageSlide id={pageId(media.pageIds, GALLERY_PAGES[0])} />,
          thumb: <Thumb id={pageId(media.pageIds, GALLERY_PAGES[0])} />,
        },
        {
          id: VISUAL.stack,
          label: pdp.slides[4] ?? "",
          node: <CutoutSlide id={VISUAL.stack} />,
          thumb: <Thumb id={VISUAL.stack} />,
        },
        {
          id: VISUAL.life.print,
          label: pdp.slides[5] ?? "",
          node: (
            <div className={SLIDE}>
              <Photo
                id={VISUAL.life.print}
                sizes={GALLERY_SIZES}
                caption={caption}
                className="size-full rounded-none shadow-none"
              />
            </div>
          ),
          thumb: <Thumb id={VISUAL.life.print} />,
        },
        {
          id: pageId(media.pageIds, GALLERY_PAGES[1]),
          label: pdp.slides[6] ?? "",
          node: <PageSlide id={pageId(media.pageIds, GALLERY_PAGES[1])} />,
          thumb: <Thumb id={pageId(media.pageIds, GALLERY_PAGES[1])} />,
        },
        {
          id: VISUAL.tablet,
          label: pdp.slides[7] ?? "",
          node: <CutoutSlide id={VISUAL.tablet} />,
          thumb: <Thumb id={VISUAL.tablet} />,
        },
      ]
    : [];

  const details = pdp
    ? [
        {
          title: pdp.details.includes,
          body: (
            <ul className="grid gap-2" role="list">
              {product.resources.map((resource, index) => (
                <li key={resource.id} className="flex items-baseline justify-between gap-3">
                  <span className="font-bold text-ink">
                    {index === 0 ? resource.title : `${labels?.bonus ?? ""} ${index} · ${resource.title}`}
                  </span>
                  <span className="shrink-0 text-tiny font-bold text-subtle">{resource.pagesLabel}</span>
                </li>
              ))}
            </ul>
          ),
        },
        { title: pdp.details.usage.title, body: <p>{pdp.details.usage.text}</p> },
        { title: pdp.details.format.title, body: <p>{pdp.details.format.text}</p> },
        { title: pdp.details.guarantee.title, body: <p>{pdp.details.guarantee.text}</p> },
      ]
    : [];

  const trust: { icon: IconName; text: string }[] = assurance
    ? [
        { icon: "shield", text: copy.trust[0]?.text ?? assurance.payment },
        { icon: "download", text: assurance.access },
        { icon: "refresh", text: assurance.guarantee },
      ]
    : copy.trust.slice(0, 3);

  return (
    <PageShell
      topbar={<Topbar items={copy.topbar} />}
      nav={copy.nav}
      cta={headerCta}
      subtitle={copy.subtitle}
      overlay
    >
      {jsonLdScript(productJsonLd(product))}
      {jsonLdScript(breadcrumbJsonLd(product))}
      <ViewContentOnMount product={product.slug} name={product.name} value={price} />

      <AgeProvider initial={defaultAge}>
        <ProductHero
          id="hero"
          titleId="hero-title"
          breadcrumb={pdp?.breadcrumb ?? { home: "Inicio", label: product.shortName }}
          gallery={
            <ProductGallery
              slides={gallerySlides}
              label={pdp?.galleryLabel ?? product.name}
              itemLabel={pdp?.galleryItem ?? ""}
              frameClassName="rounded-2xl border border-white/90 shadow-float bg-[radial-gradient(70%_55%_at_72%_18%,oklch(1_0_0/95%),transparent_70%),linear-gradient(165deg,var(--pv-celeste),var(--pv-white)_55%,var(--pv-peach))]"
            />
          }
          buyBox={
            <BuyBox
              id="comprar"
              titleId="hero-title"
              kicker={copy.hero.kicker}
              title={copy.hero.title}
              tagline={pdp?.tagline ?? ""}
              taglineAccent={pdp?.taglineAccent}
              lead={copy.hero.lead}
              badges={(pdp?.badges ?? []).map((badge) => ({ icon: badge.icon, text: factText(badge) }))}
              price={price}
              priceTag={pdp?.priceTag ?? ""}
              taxNote={copy.hero.taxNote}
              variant={
                ages ? <AgeSelector legend={ages.legend} options={ages.items} initial={defaultAge} /> : null
              }
              cta={
                <CheckoutLink product={target} position="hero" className={CTA_BUY}>
                  {ctaLabel(copy.hero.cta, copy.sticky.cta, "wide")}
                </CheckoutLink>
              }
              trust={trust}
              secondary={copy.hero.secondary}
              details={details}
            />
          }
        />
      </AgeProvider>

      {copy.facts ? (
        <section aria-label={copy.facts.label} className="bg-linear-to-b from-cream to-white pb-6">
          <Marquee
            label={copy.facts.label}
            seconds={38}
            gap="0.75rem"
            className="py-2"
            items={copy.facts.items.map((item) => (
              <span
                key={item.text}
                className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-navy/8 bg-white px-4 text-small font-extrabold whitespace-nowrap text-navy shadow-sm"
              >
                <Icon name={item.icon} size={18} strokeWidth={2.4} className="text-teal" />
                {factText(item)}
              </span>
            ))}
          />
        </section>
      ) : null}

      <Section
        tone="aurora-sky"
        id="incluye"
        labelledBy="incluye-title"
        className="scroll-mt-(--header-height)"
      >
        <Includes
          titleId="incluye-title"
          kicker={copy.included.kicker}
          title={copy.included.title}
          titleAccent={copy.included.titleAccent}
          lead={copy.included.lead}
          counts={{ pdf: composition.pdfCount, pages: composition.pageCount }}
          units={units}
          resources={product.resources}
          labels={{
            main: labels?.main ?? "",
            bonus: labels?.bonus ?? "",
            included: labels?.included ?? "",
          }}
          kit={{
            title: copy.included.tiles?.kitTitle ?? "",
            text: copy.included.tiles?.kitText ?? "",
            image: VISUAL.kit,
          }}
          price={{
            kicker: copy.included.tiles?.priceKicker ?? "",
            value: formatUsd(price),
            note: copy.included.tiles?.priceNote ?? "",
            link: copy.included.tiles?.priceLink ?? "",
            href: "#oferta",
          }}
        />
      </Section>

      <Section tone="aurora-cream" labelledBy="problema-title" className="cq overflow-x-clip">
        <Blend from="var(--pv-celeste)" />
        <div className="relative grid items-center gap-12 cq-lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] cq-lg:gap-16">
          <div className="grid content-center justify-items-start gap-5" data-reveal="blur">
            <Eyebrow>{copy.problem.kicker}</Eyebrow>
            <h2 id="problema-title" className="text-[clamp(2rem,1.5rem+1.6vw,2.875rem)]">
              <Accent text={copy.problem.title} accent={copy.problem.titleAccent} />
            </h2>
            {copy.problem.paragraphs.map((paragraph) => (
              <p key={paragraph} className="lead max-w-[62ch] text-pretty">
                {paragraph}
              </p>
            ))}
            <ul className="grid gap-3" role="list">
              {copy.problem.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 font-semibold text-ink">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-lemon text-navy">
                    <Icon name="star" size={15} strokeWidth={2.6} />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-xl pb-14 pl-4 cq-lg:pl-0" data-reveal="">
            <Photo
              id={VISUAL.life.routine}
              sizes="(min-width: 1024px) 560px, 92vw"
              caption={caption}
              className="aspect-[4/3.2]"
            />
            <div className="absolute bottom-0 -left-1 w-[44%] rotate-[-4deg] overflow-hidden rounded-xl border-4 border-white shadow-float [&_img]:aspect-[5/4] [&_img]:w-full [&_img]:object-cover [&_picture]:contents">
              <MediaImage id={VISUAL.life.proud} sizes="(min-width: 1024px) 250px, 40vw" alt="" />
            </div>
            {copy.problem.note ? (
              <div className="glass absolute -right-1 bottom-[calc(3.5rem+15%)] flex max-w-[60%] items-center gap-3 rounded-xl p-3 pr-5 shadow-float cq-sm:-right-6 cq-sm:max-w-none">
                <span className="grid size-11 place-items-center rounded-lg bg-lemon text-navy">
                  <Icon name="clock" size={22} strokeWidth={2.4} />
                </span>
                <span className="grid">
                  <span className="font-display text-xl leading-tight font-bold text-ink">
                    {copy.problem.note.title}
                  </span>
                  <span className="text-small font-bold text-body">{copy.problem.note.text}</span>
                </span>
              </div>
            ) : null}
            <SyllableTile tone="turquoise" size="sm" delay={2} rotate={8} className="-top-4 right-4">
              MA
            </SyllableTile>
          </div>
        </div>

        <div className="mt-20 grid gap-8">
          <div className="grid max-w-[62ch] gap-3" data-reveal="">
            <Eyebrow>{copy.benefits.kicker}</Eyebrow>
            <h3 className="font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-tight font-bold text-ink">
              <Accent text={copy.benefits.title} accent={copy.benefits.titleAccent} />
            </h3>
          </div>
          <ul className="grid grid-cols-2 gap-3 cq-sm:gap-4 cq-lg:grid-cols-4" role="list">
            {copy.benefits.items.map((item, index) => (
              <li
                key={item.title}
                className="grid content-start gap-2 rounded-xl border border-white bg-white/85 p-4 shadow-float cq-sm:gap-3 cq-sm:p-6"
                data-reveal=""
                style={{ "--i": index } as CSSProperties}
              >
                <span
                  className={`grid size-13 place-items-center rounded-lg text-navy ${
                    [
                      "bg-linear-135 from-mint to-turquoise",
                      "bg-linear-135 from-sky to-blue-soft",
                      "bg-linear-135 from-lemon to-gold",
                      "bg-linear-135 from-rose to-peach",
                    ][index % 4]
                  }`}
                >
                  <Icon name={item.icon} size={24} strokeWidth={2.2} />
                </span>
                <h4 className="text-base font-extrabold text-ink cq-sm:text-h3">{item.title}</h4>
                <p className="text-small text-pretty text-body cq-sm:text-base">{item.text}</p>
              </li>
            ))}
          </ul>
          <figure className="cq relative m-0 overflow-hidden rounded-2xl bg-sky shadow-float" data-reveal="">
            <div className="aspect-[16/10] cq-md:aspect-[16/7] [&_img]:size-full [&_img]:object-cover [&_img]:object-left [&_picture]:contents">
              <MediaImage id={VISUAL.life.editorial} sizes="(min-width: 1280px) 1200px, 96vw" alt="" />
            </div>
            <blockquote className="glass m-0 grid gap-3 p-6 cq-md:absolute cq-md:top-1/2 cq-md:right-6 cq-md:w-[40%] cq-md:-translate-y-1/2 cq-md:rounded-xl cq-md:p-8 cq-md:shadow-float">
              <span aria-hidden="true" className="font-display text-5xl leading-none text-teal">
                “
              </span>
              <p className="font-display text-[clamp(1.35rem,1.15rem+0.9vw,1.9rem)] leading-snug font-semibold text-balance text-ink">
                {copy.benefits.callout}
              </p>
            </blockquote>
            {caption ? (
              <figcaption className="absolute top-3 left-3 rounded-pill bg-white/88 px-3 py-1 text-tiny font-bold text-body shadow-sm">
                {caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      </Section>

      <Section
        tone="navy"
        id="metodo"
        labelledBy="metodo-title"
        divider="arc"
        backdrop={<Universe variant="band" />}
        container={false}
        className="cq pb-[calc(var(--section-pad)+clamp(2.5rem,7vw,6.5rem))]"
      >
        <div className="page-container relative grid gap-12">
          <SectionHeading
            id="metodo-title"
            kicker={copy.method.kicker}
            title={<Accent text={copy.method.title} accent={copy.method.titleAccent} tone="sky" />}
            lead={copy.method.lead}
            align="center"
            className="mb-0"
          />
          <MethodSteps steps={copy.method.steps} />
          {copy.playground ? (
            <PlaygroundCard kicker={copy.playground.kicker} image={VISUAL.playground}>
              <SyllablePlayground
                title={copy.playground.title}
                hint={copy.playground.hint}
                doneLabel={copy.playground.doneLabel}
                words={copy.playground.words.map((word) => ({
                  syllables: word.syllables,
                  word: word.word,
                  page: (
                    <MediaImage
                      id={pageId(media.pageIds, word.page)}
                      sizes="(min-width: 1024px) 380px, 86vw"
                    />
                  ),
                }))}
              />
            </PlaygroundCard>
          ) : null}
          <div
            className="glass-dark grid items-center gap-8 overflow-hidden rounded-2xl p-5 cq-sm:p-8 @min-[56rem]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] @min-[56rem]:p-6"
            data-reveal=""
          >
            <Photo
              id={VISUAL.life.flatlay}
              sizes="(min-width: 1024px) 540px, 90vw"
              className="aspect-[4/3] shadow-none"
            />
            <div className="grid content-center gap-4 @min-[56rem]:pr-6">
              <Eyebrow>{copy.credibility.kicker}</Eyebrow>
              <h3 className="font-display text-[clamp(1.6rem,1.3rem+1.2vw,2.25rem)] leading-tight font-bold text-white">
                {copy.credibility.title}
              </h3>
              <p className="text-pretty">{copy.credibility.text}</p>
              <ul className="grid gap-2.5" role="list">
                {copy.credibility.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 font-bold">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-gold text-ink">
                      <Icon name="check" size={14} strokeWidth={2.8} />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <Arc fill="var(--pv-white)" className="absolute inset-x-0 -bottom-px" />
      </Section>

      <Section
        tone="aurora-sky"
        id="paginas"
        labelledBy="paginas-title"
        container={false}
        className="overflow-x-clip"
      >
        <div className="page-container">
          <SectionHeading
            id="paginas-title"
            kicker={copy.pages.kicker}
            title={<Accent text={copy.pages.title} accent={copy.pages.titleAccent} />}
            lead={copy.pages.lead}
            align="center"
          />
        </div>
        <PageWall
          ids={media.pageIds}
          label={copy.pages.wallLabel ?? copy.pages.galleryLabel}
          className="my-10"
        />
        <div className="page-container">
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
        </div>
      </Section>

      <Section tone="aurora-cream" id="videos" labelledBy="videos-title" className="cq">
        <Blend from="var(--pv-celeste)" />
        <div className="relative">
          <SectionHeading
            id="videos-title"
            kicker={copy.videos.kicker}
            title={<Accent text={copy.videos.title} accent={copy.videos.titleAccent} />}
            lead={copy.videos.lead}
            align="center"
          />
          <VideoBlock items={videos} illustrativeLabel={copy.videos.illustrative} />
        </div>
      </Section>

      <Section
        tone="aurora-blue"
        id="oferta"
        labelledBy="oferta-title"
        className="scroll-mt-(--header-height)"
      >
        <OfferCard
          titleId="oferta-title"
          kicker={copy.offer?.kicker ?? copy.hero.priceKicker}
          title={copy.midOffer.title}
          text={copy.midOffer.text}
          checks={withBundle(copy.offer?.checks ?? copy.finalOffer.checks)}
          highlight={allIncluded}
          pointer={VISUAL.pointer}
          price={{
            kicker: copy.hero.priceKicker,
            value: price,
            taxNote: copy.hero.taxNote,
            guarantee: copy.hero.ctaNote,
          }}
          cta={
            <CheckoutLink product={target} position="oferta" className={CTA}>
              {ctaLabel(copy.midOffer.cta, copy.sticky.cta)}
            </CheckoutLink>
          }
          footer={
            <ul
              className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-small font-bold text-body"
              role="list"
            >
              {copy.trust.map((item) => (
                <li key={item.text} className="flex items-center gap-2">
                  <Icon name={item.icon} size={18} strokeWidth={2.2} className="text-teal" />
                  {item.text}
                </li>
              ))}
            </ul>
          }
        />
      </Section>

      {copy.audience ? (
        <Section tone="aurora-cream" id="para-quien" labelledBy="audience-title" className="cq">
          <SectionHeading
            id="audience-title"
            kicker={copy.audience.kicker}
            title={<Accent text={copy.audience.title} accent={copy.audience.titleAccent} />}
            align="center"
          />
          <AudienceCards
            yes={copy.audience.yes}
            no={copy.audience.no}
            photo={
              <Photo
                id={VISUAL.life.family}
                sizes="(min-width: 1024px) 520px, 50vw"
                caption={caption}
                className="h-full min-h-80"
                imgClassName="[&_img]:object-[70%_50%]"
              />
            }
          />
        </Section>
      ) : null}

      {copy.creator?.enabled ? (
        <Section tone="lemon" labelledBy="creator-title">
          <CreatorNote
            titleId="creator-title"
            kicker={copy.creator.kicker}
            title={copy.creator.title}
            paragraphs={copy.creator.paragraphs}
            signature={copy.creator.signature}
          />
        </Section>
      ) : null}

      <Section tone="aurora-sky" id="preguntas" labelledBy="faq-title" className="cq">
        <div className="grid gap-10 cq-lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] cq-lg:gap-16">
          <div className="grid content-start gap-5 cq-lg:sticky cq-lg:top-[calc(var(--header-height)+1.5rem)]">
            <SectionHeading
              id="faq-title"
              kicker={copy.faq.kicker}
              title={<Accent text={copy.faq.title} accent={copy.faq.titleAccent} />}
              className="mb-0"
            />
            <div className="glass flex items-start gap-3 rounded-xl p-5 shadow-float">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint text-teal">
                <Icon name="mail" size={20} strokeWidth={2.2} />
              </span>
              <p className="text-small text-pretty">
                {copy.faq.supportNote} <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
              </p>
            </div>
          </div>
          <FAQ items={copy.faq.items} surface="glass" />
        </div>
      </Section>

      <Section
        tone="navy"
        id="oferta-final"
        labelledBy="final-title"
        divider="arc"
        backdrop={<Universe variant="band" />}
        className="cq scroll-mt-(--header-height) [&>[data-slot=universe]]:sky-nebula"
      >
        <FinalOffer
          titleId="final-title"
          kicker={copy.finalOffer.kicker}
          title={copy.finalOffer.title}
          titleAccent={copy.finalOffer.titleAccent}
          checks={withBundle(copy.finalOffer.checks)}
          image={VISUAL.closing}
          cta={
            <CheckoutLink product={target} position="final" className={CTA_FINAL}>
              {ctaLabel(copy.finalOffer.cta, copy.sticky.cta, "band")}
            </CheckoutLink>
          }
          priceLine={[formatUsd(price), copy.finalOffer.priceNote].filter(Boolean).join(" · ")}
          currencyNote={localCurrencyNoteShort}
          note={copy.finalOffer.note}
        />
      </Section>

      <StickyCTA
        hideWhenVisible={['a[data-position="hero"]', "#comprar", "#oferta", "#oferta-final", "footer"]}
        label={`${copy.sticky.label} · ${formatUsd(price)}`}
        note={localCurrencyNoteShort}
        thumb={<MediaImage id={media.cards[0] ?? media.hero} sizes="44px" alt="" />}
      >
        <CheckoutLink product={target} position="sticky" className={CTA}>
          {copy.sticky.cta}
        </CheckoutLink>
      </StickyCTA>
    </PageShell>
  );
}
