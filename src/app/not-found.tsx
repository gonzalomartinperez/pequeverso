import { notFoundCopy as copy } from "@content/es/soporte";
import type { Metadata } from "next";
import { ChipRow } from "@/components/blocks/chip-row";
import { CTAButton } from "@/components/blocks/cta-button";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { Section } from "@/components/blocks/section";
import { Split } from "@/components/blocks/split";
import { Stack } from "@/components/blocks/stack";
import { PageShell } from "@/components/layout/page-shell";
import { Orbit } from "@/motion/orbit";
import { coreProducts } from "@/products";

export const metadata: Metadata = {
  title: copy.meta.title,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageShell>
      <Section tone="cream" labelledBy="not-found-title">
        <Split ratio="1.2/0.8" align="center">
          <Stack gap={5} maxWidth="60ch">
            <Eyebrow>{copy.kicker}</Eyebrow>
            <h1 id="not-found-title">{copy.title}</h1>
            <p className="lead">{copy.lead}</p>
            <ChipRow>
              <CTAButton href="/" variant="secondary" iconAfter="arrow">
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
          <LostPlanet />
        </Split>
      </Section>
    </PageShell>
  );
}

/** Decorative "lost in the small universe" sky: static planets and the orbiting star. */
function LostPlanet() {
  return (
    <div
      aria-hidden="true"
      className="sky-band relative hidden aspect-square w-full max-w-sm justify-self-center overflow-hidden rounded-xl shadow-lg cq-md:block"
    >
      <div className="planet-teal absolute top-[18%] left-[22%] size-[46%] rounded-full" />
      <div className="planet-gold absolute right-[14%] bottom-[14%] size-[16%] rounded-full" />
      <Orbit className="absolute inset-x-[4%] top-[20%]" />
    </div>
  );
}
