import { homeCopy as copy } from "@content/es/home";
import type { CSSProperties } from "react";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { SyllablePlayground } from "@/features/playground/syllable-playground";
import { StaticStarfield } from "@/motion/scene/static-starfield";
import { pageAt } from "./home-data";
import { Pill } from "./home-ui";

const STEP_TILES = [
  "from-turquoise/35 to-teal/20",
  "from-gold/35 to-gold/10",
  "from-blue-soft/40 to-white/10",
  "from-peach/40 to-coral/15",
] as const;

/**
 * "Cómo funciona": a rounded navy card inset from the page edges (the universe framing the
 * paper), the four gestures as glass tiles, the father and son with the GA · TO cards popping
 * out of its top edge, and the interactive syllable playground on real worksheets.
 */
export function MethodBand() {
  const m = copy.method;
  const words = m.playground.words.map((word) => ({
    syllables: word.syllables,
    word: word.word,
    page: <MediaImage id={pageAt(word.page)} sizes="(min-width: 1024px) 520px, 90vw" />,
  }));
  return (
    <section
      id="metodo"
      aria-labelledby="metodo-title"
      className="cq relative scroll-mt-(--header-height) bg-cream px-3 pt-24 pb-(--section-pad) cq-sm:px-5 cq-lg:pt-32"
    >
      <div className="on-navy relative mx-auto max-w-[88rem] rounded-2xl cq-lg:rounded-[3rem]">
        {/* Backdrop, clipped to the rounded card (the cut-out below is not). */}
        <div
          aria-hidden="true"
          className="sky-nebula absolute inset-0 overflow-hidden rounded-[inherit] shadow-[0_40px_90px_-40px_oklch(0.3175_0.1094_256.25/70%)]"
        >
          <StaticStarfield pattern="reuse" className="opacity-70" />
          <div className="planet-gold absolute -bottom-10 -left-10 size-40 rounded-full opacity-90" />
        </div>

        <div className="relative page-container grid gap-10 py-14 cq-lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] cq-lg:gap-14 cq-lg:py-20">
          <div className="grid content-start justify-items-start gap-4">
            <Pill tone="gold">{m.kicker}</Pill>
            <h2 id="metodo-title" className="text-[clamp(2.25rem,1.6rem+2.6vw,4rem)]">
              {m.title}
            </h2>
            <p className="lead max-w-[46ch] text-pretty">{m.lead}</p>
            <ol className="mt-4 grid w-full grid-cols-2 gap-3">
              {m.steps.map((step, index) => (
                <li
                  key={step.title}
                  data-reveal=""
                  style={{ "--i": index } as CSSProperties}
                  className="glass-dark relative grid content-start gap-2 rounded-xl p-4 cq-sm:p-5"
                >
                  <span className="flex items-center justify-between">
                    <span
                      aria-hidden="true"
                      className={`grid size-12 place-items-center rounded-md bg-linear-135 ${STEP_TILES[index % STEP_TILES.length]} text-gold ring-1 ring-white/15`}
                    >
                      <Icon name={step.icon} size={22} strokeWidth={2.2} />
                    </span>
                    <span
                      aria-hidden="true"
                      data-n={`0${index + 1}`}
                      className="font-display text-[1.75rem] font-bold text-white/25 tabular-nums before:content-[attr(data-n)]"
                    />
                  </span>
                  <span className="font-display text-[1.4rem] leading-tight font-bold text-white cq-sm:text-[1.6rem]">
                    {step.title}
                  </span>
                  <span className="text-small text-body cq-sm:text-base">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative -order-1 -mt-40 -mb-6 cq-lg:order-none cq-lg:m-0">
            <div className="pointer-events-none relative mx-auto w-[min(15rem,68%)] cq-lg:absolute cq-lg:right-0 cq-lg:-bottom-8 cq-lg:w-[min(32rem,100%)]">
              <MediaImage
                id="gf.cutout.tarjetas"
                sizes="(min-width: 1024px) 512px, 240px"
                className="h-auto w-full [mask-image:linear-gradient(180deg,#000_78%,transparent)]"
              />
            </div>
            <p className="relative mt-1 text-center text-tiny text-white/70 cq-lg:absolute cq-lg:right-0 cq-lg:-bottom-6 cq-lg:mt-0">
              {copy.illustrative}
            </p>
          </div>
          <div className="cq-lg:col-span-2" data-reveal="">
            <SyllablePlayground
              words={words}
              title={m.playground.title}
              hint={m.playground.hint}
              doneLabel={m.playground.doneLabel}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
