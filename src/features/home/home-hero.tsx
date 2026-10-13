import { homeCopy as copy } from "@content/es/home";
import { hubCopy } from "@content/es/hub";
import type { CSSProperties } from "react";
import { feeding, reading } from "@/features/hub/hub-products";
import { Float } from "@/motion/float";
import { Door } from "./door";
import { Pill, Sparkle } from "./home-ui";

const enter = (order: number): CSSProperties => ({ "--i": order }) as CSSProperties;
const DISCLOSURE_ID = "hero-afiliado";

/**
 * Hub hero: a short promise on the light sky and, right under it, the need selector «¿Qué
 * necesitas hoy?» with two doors of the same size and weight (`#elige`). On phones the two doors sit
 * side by side, so both are inside the first viewport; from lg each door turns horizontal. A
 * dashed orbit with the gold star joins the two doors (the small universe, scroll-driven, still
 * under reduced motion). The reading door holds the one priority image; the h1 is the LCP
 * candidate at every width. The course door is described by the affiliate disclosure printed
 * under the doors. The header floats over the band (`PageShell overlay`), so it reserves
 * `--header-height` itself.
 */
export function HomeHero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="cq relative isolate overflow-clip bg-[linear-gradient(180deg,var(--pv-celeste)_0%,var(--pv-white)_55%,var(--pv-cream)_100%)] pt-[calc(var(--header-height)+1rem)] pb-12 cq-md:pt-[calc(var(--header-height)+2.5rem)] cq-lg:pb-20"
    >
      <HeroGlows />
      <div className="page-container grid justify-items-center gap-3 text-center cq-sm:gap-4">
        <div data-hero-enter="" style={enter(0)}>
          <Pill tone="white">{copy.hero.kicker}</Pill>
        </div>
        <h1
          id="hero-title"
          className="max-w-[17ch] text-[clamp(2.125rem,1.4rem+3.6vw,4.5rem)] text-balance"
          data-hero-enter="title"
          style={enter(1)}
        >
          {copy.hero.title.before}
          <span className="relative inline-block">
            <span className="text-gradient">{copy.hero.title.accent}</span>
            <Swoosh />
          </span>
          {copy.hero.title.after}
        </h1>
        <p className="lead max-w-[40ch] text-pretty" data-hero-enter="" style={enter(2)}>
          {copy.hero.lead}
        </p>
      </div>

      <div id="elige" className="page-container relative mt-6 cq-md:mt-10">
        <h2
          className="mb-3 flex items-center justify-center gap-3 text-small font-extrabold tracking-[0.1em] text-navy uppercase cq-md:mb-5"
          data-hero-enter=""
          style={enter(3)}
        >
          <span aria-hidden="true" className="h-px w-8 bg-navy/20 cq-sm:w-14" />
          {copy.hero.doors}
          <span aria-hidden="true" className="h-px w-8 bg-navy/20 cq-sm:w-14" />
        </h2>
        <div className="relative mx-auto max-w-[68rem]">
          <DoorsOrbit />
          <ul
            className="relative grid grid-cols-1 gap-3 cq-xs:grid-cols-2 cq-md:gap-5 cq-lg:gap-7"
            role="list"
          >
            <li className="min-w-0">
              <Door need={reading} priority order={4} />
            </li>
            <li className="min-w-0">
              <Door need={feeding} order={5} describedBy={DISCLOSURE_ID} />
            </li>
          </ul>
        </div>
        <p
          id={DISCLOSURE_ID}
          className="mx-auto mt-3 max-w-[68rem] text-center text-tiny text-pretty text-subtle cq-xs:text-end"
        >
          {feeding.name} · {hubCopy.feeding.disclosure}
        </p>
      </div>
    </section>
  );
}

/**
 * The orbit that joins the two doors: a wide dashed ring behind them, a gold star bobbing where it
 * crosses between the doors and a small planet on its far side. Transform-only (`Float`), still
 * under reduced motion; decorative.
 */
function DoorsOrbit() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-4%] -inset-y-[7%]">
      <div className="absolute inset-0 rounded-[50%] border-[1.5px] border-dashed border-teal/30" />
      <div className="absolute top-1/2 left-1/2 z-1 hidden -translate-1/2 cq-md:block">
        <Float range={8}>
          <Sparkle className="block size-7 text-gold drop-shadow-[0_0_10px_oklch(0.8908_0.1645_93.89/80%)] cq-md:size-9" />
        </Float>
      </div>
      <div className="planet-turquoise absolute bottom-[-0.375rem] left-[22%] hidden size-3 rounded-full cq-md:block" />
      <div className="planet-gold absolute top-[30%] right-[-0.375rem] hidden size-3 rounded-full cq-md:block" />
    </div>
  );
}

/** Hand-drawn gold orbit under the accent word. */
function Swoosh() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 220 24"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -bottom-[0.14em] left-[-2%] h-[0.28em] w-[104%] text-gold"
    >
      <path
        d="M3 17C48 5 132 2 217 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Soft turquoise, blue and peach light over the sky gradient, a few still stars (no motion). */
function HeroGlows() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-1">
      <div className="absolute -top-[22%] right-[-16%] aspect-square w-[min(58rem,110vw)] rounded-full bg-[radial-gradient(closest-side,oklch(0.8521_0.0956_187.2/50%),transparent)]" />
      <div className="absolute -top-[12%] -left-[18%] aspect-square w-[min(44rem,90vw)] rounded-full bg-[radial-gradient(closest-side,oklch(0.9013_0.0458_264.2/95%),transparent)]" />
      <div className="absolute bottom-[-18%] left-[30%] aspect-square w-[min(46rem,100vw)] rounded-full bg-[radial-gradient(closest-side,oklch(0.9483_0.0301_55.6/95%),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(oklch(0.3175_0.1094_256.25/9%)_1px,transparent_1.4px)] [background-size:26px_26px] [mask-image:linear-gradient(180deg,#000,transparent_60%)]" />
      <div className="planet-gold absolute top-[18%] left-[8%] size-3 rounded-full cq-md:size-5" />
      <div className="planet-turquoise absolute top-[30%] right-[9%] size-2 rounded-full cq-md:size-3.5" />
      <Sparkle className="absolute top-[14%] right-[22%] size-4 text-gold cq-md:size-6" />
      <Sparkle className="absolute top-[40%] left-[16%] size-3 text-teal" />
    </div>
  );
}
