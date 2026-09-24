import type { ReactNode } from "react";
import { BulletList } from "@/components/blocks/bullet-list";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { PriceBlock } from "@/components/blocks/price-block";
import { Split } from "@/components/blocks/split";
import { Stack } from "@/components/blocks/stack";
import { Card } from "@/components/ui/card";
import styles from "./OfferCard.module.css";

type Props = {
  titleId: string;
  kicker: string;
  title: string;
  text: string;
  checks: readonly string[];
  price: { kicker: string; value: number; taxNote: string };
  cta: ReactNode;
};

/** Emphasised offer: what the single payment includes beside the price block and its CTA. */
export function OfferCard({ titleId, kicker, title, text, checks, price, cta }: Props) {
  return (
    <Card variant="emphasis" pad="lg" className={styles.card} reveal>
      <Split ratio="1.1/0.9" align="center">
        <Stack gap={4}>
          <Eyebrow>{kicker}</Eyebrow>
          <h2 id={titleId}>{title}</h2>
          <p className="lead">{text}</p>
          <BulletList items={checks} icon="shield" />
        </Stack>
        <PriceBlock kicker={price.kicker} price={price.value} taxNote={price.taxNote} cta={cta} />
      </Split>
    </Card>
  );
}
