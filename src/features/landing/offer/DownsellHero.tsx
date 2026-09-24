import { Eyebrow } from "@/components/blocks/eyebrow";
import { FactChip } from "@/components/blocks/fact-chip";
import { IconBadge } from "@/components/blocks/icon-badge";
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
        <Stack gap={5}>
          <Eyebrow>{copy.downsell.kicker}</Eyebrow>
          <h1 id="hero-title-downsell" data-hero-enter="title">
            {copy.downsell.title}
          </h1>
          <p className="lead max-w-[58ch]">{copy.downsell.lead}</p>
          <FactChip icon="shield" label={copy.downsell.proof} />
          <PriceBlock
            kicker={copy.downsell.priceKicker}
            price={pricing.downsell}
            previous={{ label: copy.downsell.previousLabel, price: pricing.upsell }}
            taxNote={copy.taxNote}
            cta={<DecisionLink>{copy.header.cta}</DecisionLink>}
            ctaNote={copy.downsell.decisionHint}
            className="w-full max-w-md"
          />
        </Stack>
        <Stack gap={3} className="cq-md:pt-12">
          {copy.downsell.objections.map((item, index) => (
            <Card
              key={item.title}
              as="article"
              reveal
              stagger={index}
              className="grid-cols-[auto_1fr] gap-x-4"
            >
              <IconBadge icon="check" size={48} className="row-span-2" />
              <p className="font-display text-h3 font-bold text-heading">{item.title}</p>
              <p>{item.text}</p>
            </Card>
          ))}
        </Stack>
      </Split>
    </Section>
  );
}
