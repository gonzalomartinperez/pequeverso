import { ChipRow } from "@/components/blocks/chip-row";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { FactChip } from "@/components/blocks/fact-chip";
import { MediaFrame } from "@/components/blocks/media-frame";
import { MediaImage } from "@/components/blocks/media-image";
import { PriceBlock } from "@/components/blocks/price-block";
import { Section } from "@/components/blocks/section";
import { Split } from "@/components/blocks/split";
import { Stack } from "@/components/blocks/stack";
import { DecisionLink } from "@/features/commerce/DecisionLink/DecisionLink";
import type { OfferProduct } from "@/products/schema";
import { CounterChip } from "./CounterChip";

export type CounterFact = { value: number; unit: string };

type Props = { product: OfferProduct; counters: readonly CounterFact[] };

/** Upsell view of the offer hero: eyebrow, title, counters, price block and the product image. */
export function UpsellHero({ product, counters }: Props) {
  const { copy, media, pricing } = product;
  return (
    <Section tone="cream" id="hero" labelledBy="hero-title-upsell" className="only-upsell">
      <Split ratio="1.1/0.9" mediaFirstOnTablet>
        <Stack gap={4}>
          <Eyebrow>{copy.upsell.kicker}</Eyebrow>
          <h1 id="hero-title-upsell" data-hero-enter="title">
            {copy.upsell.title}
          </h1>
          <p className="lead">{copy.upsell.lead}</p>
          <ChipRow>
            {counters.map((fact) => (
              <CounterChip key={fact.unit} value={fact.value} unit={fact.unit} />
            ))}
            {copy.facts.map((fact) => (
              <FactChip key={fact.label} label={fact.label} detail={fact.detail} />
            ))}
          </ChipRow>
          <PriceBlock
            kicker={copy.upsell.priceKicker}
            price={pricing.upsell}
            taxNote={copy.taxNote}
            cta={<DecisionLink>{copy.header.cta}</DecisionLink>}
            ctaNote={copy.upsell.decisionHint}
          />
        </Stack>
        <div data-hero-enter="media">
          <MediaFrame ratio="4/3" elevation="lg" tilt as="figure">
            <MediaImage id={media.hero} sizes="(min-width: 1024px) 560px, 92vw" priority />
          </MediaFrame>
        </div>
      </Split>
    </Section>
  );
}
