import { notFoundCopy as copy } from "@content/es/soporte";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { CTAButton } from "@/components/blocks/cta-button";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { MediaImage } from "@/components/blocks/media-image";
import { PageShell } from "@/components/layout/page-shell";
import { Float } from "@/motion/float";
import { Orbit } from "@/motion/orbit";
import { coreProducts } from "@/products";

const STARS: CSSProperties = {
  backgroundImage: ["18% 28%", "36% 62%", "72% 20%", "82% 54%", "26% 80%", "64% 78%", "48% 12%"]
    .map((at) => `radial-gradient(1.5px 1.5px at ${at}, #fff 50%, transparent 51%)`)
    .join(","),
};

export const metadata: Metadata = {
  title: copy.meta.title,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PageShell overlay>
      <section
        aria-labelledby="not-found-title"
        className="aurora-sky relative isolate overflow-clip pt-[calc(var(--header-height)+clamp(2rem,6vw,4.5rem))] pb-[calc(var(--section-pad)+clamp(2rem,5vw,4rem))]"
      >
        <div className="page-container cq">
          <div className="grid items-center gap-10 cq-md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] cq-md:gap-12">
            <div className="grid justify-items-start gap-5">
              <Eyebrow>{copy.kicker}</Eyebrow>
              <h1 id="not-found-title" className="max-w-[14ch] text-balance">
                {copy.title}
              </h1>
              <p className="lead max-w-[46ch] text-pretty">{copy.lead}</p>
              <div className="flex flex-wrap gap-3 pt-2 [&>a]:rounded-pill">
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
              </div>
            </div>
            <LostInSpace />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

/**
 * Decorative "lost in the small universe": a window onto the navy sky with the orbiting star,
 * the real syllable cards and pencils drifting out of it, and three syllable tiles that spell
 * PER · DI · DO (lost) the way the method joins syllables. Still under reduced motion.
 */
function LostInSpace() {
  const tile =
    "grid place-items-center rounded-lg font-display font-bold leading-none shadow-float ring-1 ring-white/60 size-[clamp(3.25rem,9vw,4.5rem)] text-[clamp(1.25rem,3.4vw,1.75rem)]";
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-[min(20rem,80vw)] cq-md:max-w-[30rem]"
    >
      <div className="sky-nebula absolute inset-[8%] overflow-hidden rounded-full border-8 border-white/70 shadow-float">
        <div className="absolute inset-0 opacity-80" style={STARS} />
        <div className="planet-turquoise absolute top-[16%] left-[18%] size-[18%] rounded-full" />
        <Orbit className="absolute inset-x-[6%] top-[12%]" />
      </div>

      <Float delay={0.4} range={10} rotate={-8} className="absolute top-[4%] left-[2%]">
        <span className={`${tile} bg-gold text-ink`}>PER</span>
      </Float>
      <Float delay={1.6} range={14} rotate={6} className="absolute -top-[3%] left-[42%]">
        <span className={`${tile} bg-turquoise text-navy`}>DI</span>
      </Float>
      <Float delay={2.8} range={12} rotate={-4} className="absolute top-[12%] -right-[3%]">
        <span className={`${tile} bg-white text-navy`}>DO</span>
      </Float>

      <Float delay={1} range={8} className="absolute inset-x-[-4%] bottom-[-2%]">
        <MediaImage
          id="gf.cutout.elementos"
          sizes="(min-width: 1024px) 520px, 90vw"
          alt=""
          className="h-auto w-full"
        />
      </Float>
    </div>
  );
}
