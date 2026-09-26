import { CircleCheck } from "lucide-react";
import { DecisionLink } from "@/features/commerce/DecisionLink/DecisionLink";
import type { OfferProduct } from "@/products/schema";
import { CounterChip } from "./CounterChip";
import { OfferPrice } from "./OfferPrice";
import { PackVisual } from "./PackVisual";
import { AccentText } from "./ui";

export type CounterFact = { value: number; unit: string };

type Props = { product: OfferProduct; counters: readonly CounterFact[] };

/** Hero grid shared by both offer views: copy and facts on the left, the pack on the right. */
export const HERO_GRID =
  "page-container relative grid items-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:[grid-template-areas:'copy_visual''facts_visual']";

/** Top padding that clears the floating header (PageShell/Header `overlay`). */
export const HERO_PAD = "pt-[calc(var(--header-height)+clamp(1.5rem,0.75rem+2.4vw,3rem))] pb-(--section-pad)";

/** Heading scale for the long offer titles (the global display size is tuned for short heroes). */
export const HERO_TITLE =
  "text-[clamp(2.05rem,1.5rem+2.1vw,3.3rem)] leading-[1.07] tracking-[-0.02em] text-balance";

/**
 * Upsell view of the offer hero on the aurora sky: the "purchase confirmed, this is optional"
 * reassurance first, then title, counters, the glass price card and the floating pack visual.
 */
export function UpsellHero({ product, counters }: Props) {
  const { copy, media, pricing, resources, composition } = product;
  const covers = resources.filter((resource) => !resource.embedded).map((resource) => resource.card);
  return (
    <section
      id="hero"
      data-slot="section"
      data-tone="aurora-sky"
      aria-labelledby="hero-title-upsell"
      className={`only-upsell aurora-sky relative overflow-clip ${HERO_PAD}`}
    >
      <div className={HERO_GRID}>
        <div className="grid gap-5 lg:[grid-area:copy]">
          <p className="inline-flex w-fit max-w-full items-center gap-2 rounded-pill border border-teal/25 bg-white/80 py-1.5 pr-4 pl-1.5 text-small font-extrabold text-navy shadow-sm">
            <CircleCheck
              aria-hidden="true"
              className="size-7 shrink-0 rounded-full bg-teal p-1 text-white"
              strokeWidth={2.6}
            />
            <span className="text-balance">{copy.upsell.kicker}</span>
          </p>
          <h1 id="hero-title-upsell" data-hero-enter="title" className={HERO_TITLE}>
            <AccentText text={copy.upsell.title} />
          </h1>
          <p className="lead max-w-[56ch] text-pretty">{copy.upsell.lead}</p>
        </div>
        <PackVisual
          variant="upsell"
          hero={media.hero}
          cards={covers.slice(1, 3)}
          caption={`${composition.pdfCount} PDF · ${composition.pageCount} páginas`}
          priority
          className="max-w-[26rem] lg:[grid-area:visual] lg:max-w-[34rem]"
        />
        <div className="grid gap-6 lg:[grid-area:facts]">
          <ul
            className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap [&>li]:grid [&>li>*]:w-full"
            aria-label="El pack en números"
          >
            {counters.map((fact) => (
              <li key={fact.unit}>
                <CounterChip value={fact.value} unit={fact.unit} />
              </li>
            ))}
            {copy.facts.map((fact) => (
              <li
                key={fact.label}
                className="on-light glass inline-grid min-h-11 content-center justify-items-center gap-0.5 rounded-lg px-4 py-3 text-center"
              >
                <strong className="font-display text-[1.35rem] leading-none text-navy">{fact.label}</strong>
                <span className="text-tiny font-extrabold tracking-[0.06em] text-subtle uppercase">
                  {fact.detail}
                </span>
              </li>
            ))}
          </ul>
          <OfferPrice
            kicker={copy.upsell.priceKicker}
            price={pricing.upsell}
            taxNote={copy.taxNote}
            cta={<DecisionLink>{copy.header.cta}</DecisionLink>}
            hint={copy.upsell.decisionHint}
            className="max-w-lg"
          />
        </div>
      </div>
    </section>
  );
}
