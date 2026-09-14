import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import { Section } from "@/components/ui/Section/Section";
import { Stack } from "@/components/ui/Stack/Stack";
import { DecisionLink } from "@/features/commerce/DecisionLink/DecisionLink";
import type { OfferProduct } from "@/products/schema";

type Props = { copy: OfferProduct["copy"]["close"] };

/** Closing navy band: both answers are fine; the CTA only scrolls to the widget. */
export function CloseSection({ copy }: Props) {
  return (
    <Section tone="navy" id="cierre" labelledBy="cierre-title">
      <Stack gap={4} maxWidth="60ch">
        <Eyebrow tone="dark">{copy.kicker}</Eyebrow>
        <h2 id="cierre-title">{copy.title}</h2>
        <p className="lead">{copy.text}</p>
        <DecisionLink variant="inverse">{copy.cta}</DecisionLink>
      </Stack>
    </Section>
  );
}
