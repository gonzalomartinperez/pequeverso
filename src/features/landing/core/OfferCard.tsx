import type { ReactNode } from "react";
import { BulletList } from "@/components/ui/BulletList/BulletList";
import { Card } from "@/components/ui/Card/Card";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import { PriceBlock } from "@/components/ui/PriceBlock/PriceBlock";
import { Split } from "@/components/ui/Split/Split";
import { Stack } from "@/components/ui/Stack/Stack";
import styles from "./OfferCard.module.css";

type Props = {
  titleId: string;
  kicker: string;
  title: string;
  text: string;
  checks: readonly string[];
  price: { kicker: string; value: number; taxNote: string; currencyNote: string };
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
        <PriceBlock
          kicker={price.kicker}
          price={price.value}
          taxNote={price.taxNote}
          currencyNote={price.currencyNote}
          cta={cta}
        />
      </Split>
    </Card>
  );
}
