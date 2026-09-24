import { Eyebrow } from "@/components/blocks/eyebrow";
import { Section } from "@/components/blocks/section";
import { Stack } from "@/components/blocks/stack";
import { DecisionLink } from "@/features/commerce/DecisionLink/DecisionLink";
import type { OfferProduct } from "@/products/schema";

type Props = { copy: OfferProduct["copy"]["close"] };

/**
 * Closing navy band: both answers are fine; the CTA only scrolls to the widget. The sky and the
 * two planets are static CSS (no scene on post-purchase pages).
 */
export function CloseSection({ copy }: Props) {
  return (
    <Section tone="navy" id="cierre" labelledBy="cierre-title" className="sky-band overflow-hidden">
      <div
        aria-hidden="true"
        className="planet-teal pointer-events-none absolute -top-24 -right-24 size-[clamp(160px,22vw,300px)] rounded-full opacity-70"
      />
      <div
        aria-hidden="true"
        className="planet-gold pointer-events-none absolute -bottom-10 left-[8%] size-[clamp(56px,7vw,96px)] rounded-full opacity-80"
      />
      <Stack gap={4} maxWidth="60ch" align="center" className="relative">
        <Eyebrow tone="dark">{copy.kicker}</Eyebrow>
        <h2 id="cierre-title">{copy.title}</h2>
        <p className="lead">{copy.text}</p>
        <DecisionLink variant="inverse" className="mt-2">
          {copy.cta}
        </DecisionLink>
      </Stack>
    </Section>
  );
}
