import { Card } from "@/components/ui/Card/Card";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import { FactChip } from "@/components/ui/FactChip/FactChip";
import { PriceBlock } from "@/components/ui/PriceBlock/PriceBlock";
import { Section } from "@/components/ui/Section/Section";
import { Split } from "@/components/ui/Split/Split";
import { Stack } from "@/components/ui/Stack/Stack";
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
