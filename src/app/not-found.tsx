import { notFoundCopy as copy } from "@content/es/soporte";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell/PageShell";
import { ChipRow } from "@/components/ui/ChipRow/ChipRow";
import { CTAButton } from "@/components/ui/CTAButton/CTAButton";
import { Eyebrow } from "@/components/ui/Eyebrow/Eyebrow";
import { Section } from "@/components/ui/Section/Section";
import { Stack } from "@/components/ui/Stack/Stack";
import { coreProducts } from "@/products";

export const metadata: Metadata = {
  title: copy.meta.title,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageShell>
      <Section tone="cream" labelledBy="not-found-title">
        <Stack gap={4} maxWidth="60ch">
          <Eyebrow>{copy.kicker}</Eyebrow>
          <h1 id="not-found-title">{copy.title}</h1>
          <p className="lead">{copy.lead}</p>
          <ChipRow>
            <CTAButton href="/" variant="secondary" iconAfter="arrow">
              {copy.home}
            </CTAButton>
            {coreProducts().map((product) => (
              <CTAButton key={product.slug} href={product.path} variant="secondary" iconAfter="arrow">
                {copy.product} {product.name}
              </CTAButton>
            ))}
            <CTAButton href="/soporte/" variant="ghost" iconAfter="arrow">
              {copy.support}
            </CTAButton>
          </ChipRow>
        </Stack>
      </Section>
    </PageShell>
  );
}
