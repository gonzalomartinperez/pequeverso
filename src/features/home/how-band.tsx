import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";
import { StaticStarfield } from "@/motion/scene/static-starfield";
import { Pill } from "./home-ui";

const STEP_TILES = [
  "from-turquoise/35 to-teal/20",
  "from-gold/35 to-gold/10",
  "from-blue-soft/40 to-white/10",
  "from-peach/40 to-coral/15",
] as const;

type Step = { icon: IconName; title: string; text: string };

type Props = {
  id: string;
  kicker: string;
  title: string;
  lead: string;
  steps: readonly Step[];
  /** Transparent cut-out popping out of the card's top edge (server-rendered `MediaImage`). */
  cutout: ReactNode;
  /** Caption under the cut-out («Imagen ilustrativa.»). */
  caption: string;
  /** Full-width block under the steps (the syllable playground, the course menu). */
  extra: ReactNode;
  /** The first navy band of the page defines the shared starfield pattern; later ones reuse it. */
  starfield?: "define" | "reuse";
};

/**
 * «Cómo funciona» of one product: a rounded navy card inset from the page edges (the universe
 * framing the paper), the steps as glass tiles that rise in sequence, a cut-out popping out of its
 * top edge and one full-width block below. Both products use it, so their «how» has the same
 * weight: four gestures + the playground for the kit, three steps + the menu for the course.
 */
export function HowBand({
  id,
  kicker,
  title,
  lead,
  steps,
  cutout,
  caption,
  extra,
  starfield = "reuse",
}: Props) {
  const four = steps.length > 3;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="cq relative scroll-mt-(--header-height) bg-cream px-3 pt-24 pb-(--section-pad) cq-sm:px-5 cq-lg:pt-32"
    >
      <div className="on-navy relative mx-auto max-w-[88rem] rounded-2xl cq-lg:rounded-[3rem]">
        <div
          aria-hidden="true"
          className="sky-nebula absolute inset-0 overflow-hidden rounded-[inherit] shadow-[0_40px_90px_-40px_oklch(0.3175_0.1094_256.25/70%)]"
        >
          <StaticStarfield pattern={starfield} className="opacity-70" />
          <div className="planet-gold absolute -bottom-10 -left-10 size-40 rounded-full opacity-90" />
        </div>

        <div className="relative page-container grid gap-10 py-14 cq-lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] cq-lg:gap-14 cq-lg:py-20">
          <div className="grid content-start justify-items-start gap-4">
            <Pill tone="gold">{kicker}</Pill>
            <h2 id={`${id}-title`} className="text-[clamp(2.25rem,1.6rem+2.6vw,4rem)]">
              {title}
            </h2>
            <p className="lead max-w-[46ch] text-pretty">{lead}</p>
            <ol
              className={cn(
                "mt-4 grid w-full grid-cols-1 gap-3",
                four ? "cq-xs:grid-cols-2" : "cq-sm:grid-cols-3",
              )}
            >
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  data-reveal=""
                  style={{ "--i": index } as CSSProperties}
                  className="glass-dark relative grid content-start gap-2 rounded-xl p-4 transition-[translate,background-color] duration-(--duration) ease-out hover:bg-white/12 motion-safe:hover:-translate-y-1 cq-sm:p-5"
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
            <div className="pointer-events-none relative mx-auto w-[min(15rem,68%)] cq-lg:absolute cq-lg:right-0 cq-lg:-bottom-8 cq-lg:w-[min(30rem,100%)] [&_img]:h-auto [&_img]:w-full [&_img]:[mask-image:linear-gradient(180deg,#000_78%,transparent)]">
              {cutout}
            </div>
            <p className="relative mt-1 text-center text-tiny text-white/70 cq-lg:absolute cq-lg:right-0 cq-lg:-bottom-6 cq-lg:mt-0">
              {caption}
            </p>
          </div>
          <div className="cq-lg:col-span-2" data-reveal="">
            {extra}
          </div>
        </div>
      </div>
    </section>
  );
}
