import { BulletList } from "@/components/blocks/bullet-list";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { Grid } from "@/components/blocks/grid";
import { Section } from "@/components/blocks/section";
import { SectionHeading } from "@/components/blocks/section-heading";
import { Card } from "@/components/ui/card";
import type { OfferProduct } from "@/products/schema";

type Props = { copy: OfferProduct["copy"]["complement"] };

/** "Complementa, no repite": what the buyer already owns next to what this offer adds. */
export function ComplementSection({ copy }: Props) {
  return (
    <Section tone="cream" labelledBy="complemento-title">
      <SectionHeading id="complemento-title" kicker={copy.kicker} title={copy.title} align="center" />
      <Grid cols={2}>
        <Card variant="soft" pad="lg" reveal stagger={0}>
          <Eyebrow as="span">{copy.ownedLabel}</Eyebrow>
          <h3>{copy.owned.title}</h3>
          <BulletList items={copy.owned.points} icon="shield" />
        </Card>
        <Card variant="emphasis" pad="lg" reveal stagger={1}>
          <Eyebrow as="span">{copy.offerLabel}</Eyebrow>
          <h3>{copy.offer.title}</h3>
          <BulletList items={copy.offer.points} icon="sparkles" />
        </Card>
      </Grid>
    </Section>
  );
}
