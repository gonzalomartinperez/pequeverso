import type { ReactNode } from "react";
import { BulletList } from "@/components/blocks/bullet-list";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { PriceBlock } from "@/components/blocks/price-block";
import { Split } from "@/components/blocks/split";
import { Stack } from "@/components/blocks/stack";
import { Card } from "@/components/ui/card";

type Props = {
  titleId: string;
  kicker: string;
  title: string;
  text: string;
  checks: readonly string[];
  price: { kicker: string; value: number; taxNote: string };
  cta: ReactNode;
  /** Emphasised line under the title (e.g. "Todo incluido en un único pago de US$14,99."). */
  highlight?: string | undefined;
  /** Reassurance under the card (trust chips). */
  footer?: ReactNode | undefined;
};

/** Emphasised offer: what the single payment includes beside the price block and its CTA. */
export function OfferCard({ titleId, kicker, title, text, checks, price, cta, highlight, footer }: Props) {
  return (
    <Card
      variant="emphasis"
      pad="lg"
      className="mx-auto max-w-240 scroll-mt-(--header-height) gap-8 shadow-lg cq-sm:p-10"
      reveal
    >
      <Split ratio="1.1/0.9" align="center">
        <Stack gap={4}>
          <Eyebrow>{kicker}</Eyebrow>
          <h2 id={titleId}>{title}</h2>
          {highlight ? (
            <p className="rounded-md bg-lemon px-4 py-2 font-extrabold text-balance text-ink">{highlight}</p>
          ) : null}
          <p className="lead text-pretty">{text}</p>
          <BulletList items={checks} icon="shield" />
        </Stack>
        <PriceBlock
          kicker={price.kicker}
          price={price.value}
          taxNote={price.taxNote}
          cta={cta}
          className="border-2 border-navy/12 bg-cream shadow-none"
        />
      </Split>
      {footer}
    </Card>
  );
}
