import { Check, ShieldCheck } from "lucide-react";
import type { CSSProperties } from "react";
import { DecisionLink } from "@/features/commerce/DecisionLink/DecisionLink";
import type { OfferProduct } from "@/products/schema";
import { OfferPrice } from "./OfferPrice";
import { PackVisual } from "./PackVisual";
import { HERO_GRID, HERO_PAD, HERO_TITLE } from "./UpsellHero";
import { AccentText, Kicker } from "./ui";

type Props = { product: OfferProduct };

/**
 * Downsell view of the offer hero on a warm aurora: same pack, lower price, the previous price as
 * the only anchor, a fan of the same covers and the three objections answered as glass cards.
 */
export function DownsellHero({ product }: Props) {
  const { copy, media, pricing, resources } = product;
  const covers = resources.filter((resource) => !resource.embedded).map((resource) => resource.card);
  return (
    <section
      id="hero-downsell"
      data-slot="section"
      data-tone="aurora-cream"
      aria-labelledby="hero-title-downsell"
      className={`only-downsell aurora-cream relative overflow-clip ${HERO_PAD}`}
    >
      <div className={HERO_GRID}>
        <div className="grid gap-5 lg:[grid-area:copy]">
          <Kicker tone="warm">{copy.downsell.kicker}</Kicker>
          <h1 id="hero-title-downsell" data-hero-enter="title" className={HERO_TITLE}>
            <AccentText text={copy.downsell.title} />
          </h1>
          <p className="lead max-w-[56ch] text-pretty">{copy.downsell.lead}</p>
          <p className="on-light glass inline-flex w-fit max-w-full items-center gap-2 rounded-pill py-2 pr-4 pl-2 text-small font-extrabold text-navy shadow-sm">
            <ShieldCheck aria-hidden="true" className="size-6 shrink-0 text-teal" strokeWidth={2.2} />
            <span>{copy.downsell.proof}</span>
          </p>
        </div>
        <PackVisual
          variant="downsell"
          hero={media.hero}
          cards={covers.slice(0, 4)}
          caption={copy.downsell.proof.replace(/^[^:]+:\s*/, "")}
          className="max-w-[26rem] lg:[grid-area:visual] lg:max-w-[34rem]"
        />
        <div className="grid gap-6 lg:[grid-area:facts]">
          <OfferPrice
            kicker={copy.downsell.priceKicker}
            price={pricing.downsell}
            previous={{ label: copy.downsell.previousLabel, price: pricing.upsell }}
            taxNote={copy.taxNote}
            cta={<DecisionLink>{copy.header.cta}</DecisionLink>}
            hint={copy.downsell.decisionHint}
            className="max-w-lg"
          />
        </div>
      </div>
      <ul className="page-container relative mt-12 grid gap-4 md:grid-cols-3 lg:mt-16">
        {copy.downsell.objections.map((item, index) => (
          <li
            key={item.title}
            data-reveal=""
            style={{ "--i": index } as CSSProperties}
            className="on-light glass grid content-start gap-3 rounded-xl p-6 shadow-float"
          >
            <span className="grid size-10 place-items-center rounded-full bg-mint text-teal-text">
              <Check aria-hidden="true" className="size-5" strokeWidth={3} />
            </span>
            <p className="font-display text-[1.3rem] leading-snug font-bold text-heading">{item.title}</p>
            <p className="text-body">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
