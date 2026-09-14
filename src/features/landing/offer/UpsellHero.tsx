import { ChipRow } from "@/components/ui/ChipRow/ChipRow";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import { FactChip } from "@/components/ui/FactChip/FactChip";
import { MediaFrame } from "@/components/ui/MediaFrame/MediaFrame";
import { MediaImage } from "@/components/ui/MediaImage/MediaImage";
import { PriceBlock } from "@/components/ui/PriceBlock/PriceBlock";
import { Section } from "@/components/ui/Section/Section";
import { Split } from "@/components/ui/Split/Split";
import { Stack } from "@/components/ui/Stack/Stack";
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
