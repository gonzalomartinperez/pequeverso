import { notFoundCopy as copy } from "@content/es/soporte";
import type { Metadata } from "next";
import { ChipRow } from "@/components/blocks/chip-row";
import { CTAButton } from "@/components/blocks/cta-button";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { Section } from "@/components/blocks/section";
import { Stack } from "@/components/blocks/stack";
import { PageShell } from "@/components/layout/page-shell";
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
            <CTAButton href="/" variant="outline" iconAfter="arrow">
              {copy.home}
            </CTAButton>
            {coreProducts().map((product) => (
              <CTAButton key={product.slug} href={product.path} variant="outline" iconAfter="arrow">
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
