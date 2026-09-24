import { Eyebrow } from "@/components/blocks/eyebrow";
import { FactChip } from "@/components/blocks/fact-chip";
import { PriceBlock } from "@/components/blocks/price-block";
import { Section } from "@/components/blocks/section";
import { Split } from "@/components/blocks/split";
import { Stack } from "@/components/blocks/stack";
import { Card } from "@/components/ui/card";
import { DecisionLink } from "@/features/commerce/DecisionLink/DecisionLink";
import type { OfferProduct } from "@/products/schema";

type Props = { product: OfferProduct };

/** Downsell view of the offer hero: same pack, lower price, previous price as the only anchor. */
export function DownsellHero({ product }: Props) {
  const { copy, pricing } = product;
  return (
    <Section tone="rose" id="hero-downsell" labelledBy="hero-title-downsell" className="only-downsell">
      <Split ratio="1.1/0.9">
        <Stack gap={4}>
          <Eyebrow>{copy.downsell.kicker}</Eyebrow>
          <h1 id="hero-title-downsell" data-hero-enter="title">
            {copy.downsell.title}
          </h1>
          <p className="lead">{copy.downsell.lead}</p>
          <FactChip icon="shield" label={copy.downsell.proof} />
          <PriceBlock
            kicker={copy.downsell.priceKicker}
            price={pricing.downsell}
            previous={{ label: copy.downsell.previousLabel, price: pricing.upsell }}
            taxNote={copy.taxNote}
            cta={<DecisionLink>{copy.header.cta}</DecisionLink>}
            ctaNote={copy.downsell.decisionHint}
          />
        </Stack>
        <Stack gap={3}>
          {copy.downsell.objections.map((item, index) => (
            <Card key={item.title} as="article" reveal stagger={index}>
              <p>
                <strong>{item.title}</strong>
              </p>
              <p>{item.text}</p>
            </Card>
          ))}
        </Stack>
      </Split>
    </Section>
  );
}
