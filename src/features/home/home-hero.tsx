import { homeCopy as copy } from "@content/es/home";
import type { CSSProperties } from "react";
import { Icon } from "@/components/blocks/icon";
import { HeroVisual } from "./hero-visual";
import { LINK_NAVY, Pill, ProductLink } from "./home-ui";

const enter = (order: number): CSSProperties => ({ "--i": order }) as CSSProperties;

/**
 * Hub hero on a light sky (celeste → white → cream with turquoise and peach glows), the
 * counterpoint to the landing's navy universe: the promise with its gradient word, three fact
 * chips and one navy link to the product; beside it the navy planet with the family, the real
 * page and the glass product card. The header floats over it (`PageShell overlay`), so the band
 * reserves `--header-height` itself.
 */
export function HomeHero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="cq relative isolate overflow-clip bg-[linear-gradient(180deg,var(--pv-celeste)_0%,var(--pv-white)_52%,var(--pv-cream)_100%)] pt-[calc(var(--header-height)+1.5rem)] pb-16 cq-lg:pt-[calc(var(--header-height)+3.5rem)] cq-lg:pb-28"
    >
      <HeroGlows />
      <div className="page-container grid items-center gap-x-10 gap-y-12 cq-lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <div className="relative z-1 grid content-start justify-items-start gap-5 cq-sm:gap-6">
          <div data-hero-enter="" style={enter(0)}>
            <Pill tone="white">{copy.hero.kicker}</Pill>
          </div>
          <h1 id="hero-title" className="max-w-[13ch] text-balance" data-hero-enter="title" style={enter(1)}>
            {copy.hero.title.before}
            <span className="relative inline-block">
              <span className="text-gradient">{copy.hero.title.accent}</span>
              <Swoosh />
            </span>
            {copy.hero.title.after}
          </h1>
          <p className="lead max-w-[46ch] text-pretty" data-hero-enter="" style={enter(2)}>
            {copy.hero.lead}
          </p>
          <HeroChips className="hidden cq-sm:flex" style={enter(3)} />
          <div
            className="mt-1 flex w-full flex-wrap items-center gap-x-6 gap-y-3"
            data-hero-enter=""
            style={enter(4)}
          >
            <ProductLink position="hero" className={`${LINK_NAVY} w-full cq-sm:w-auto`}>
              {copy.hero.cta}
            </ProductLink>
            <a
              href="#paginas"
              className="inline-flex min-h-11 items-center gap-2 font-extrabold text-navy underline decoration-teal/40 decoration-2 underline-offset-6 hover:text-teal-text hover:decoration-teal"
            >
              <Icon name="files" size={18} strokeWidth={2.4} className="text-teal" />
              {copy.hero.secondary}
            </a>
          </div>
        </div>
        <HeroVisual />
        <HeroChips className="-mt-4 flex justify-center cq-sm:hidden" />
      </div>
    </section>
  );
}

/** Three fact chips: in the copy column from sm, under the visual on phones (one visible at a time). */
function HeroChips({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <ul className={`flex-wrap gap-2 cq-sm:gap-2.5 ${className}`} data-hero-enter="" style={style}>
      {copy.hero.chips.map((chip) => (
        <li
          key={chip.label}
          className="inline-flex min-h-9 items-center gap-2 rounded-pill bg-white/85 px-3.5 text-small font-extrabold text-ink shadow-[0_8px_20px_-12px_oklch(0.3175_0.1094_256.25/45%)] ring-1 ring-white cq-sm:min-h-10 cq-sm:px-4"
        >
          <Icon name={chip.icon} size={16} strokeWidth={2.4} className="text-teal" />
          {chip.label}
        </li>
      ))}
    </ul>
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

/** Soft turquoise, blue and peach light over the sky gradient (painted once, no motion). */
function HeroGlows() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-1">
      <div className="absolute -top-[18%] right-[-14%] aspect-square w-[min(58rem,110vw)] rounded-full bg-[radial-gradient(closest-side,oklch(0.8521_0.0956_187.2/55%),transparent)]" />
      <div className="absolute -top-[10%] -left-[18%] aspect-square w-[min(44rem,90vw)] rounded-full bg-[radial-gradient(closest-side,oklch(0.9013_0.0458_264.2/95%),transparent)]" />
      <div className="absolute bottom-[-22%] left-[28%] aspect-square w-[min(46rem,100vw)] rounded-full bg-[radial-gradient(closest-side,oklch(0.9483_0.0301_55.6/95%),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(oklch(0.3175_0.1094_256.25/9%)_1px,transparent_1.4px)] [background-size:26px_26px] [mask-image:linear-gradient(180deg,#000,transparent_70%)]" />
    </div>
  );
}
