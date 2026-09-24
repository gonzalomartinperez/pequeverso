import type { CSSProperties, ReactNode } from "react";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { Universe } from "@/motion/universe";
import { WaveDivider } from "@/motion/wave-divider";

type Props = {
  id: string;
  titleId: string;
  eyebrow: string;
  title: string;
  lead: string;
  /** Copy-column content between the lead and the actions (age selector, fact chips). */
  children?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  /** Assurance row under the actions (payment, access, guarantee; built from config by the page). */
  trust?: ReactNode | undefined;
  /** The `HeroStack`, placed on the sky/desk boundary. */
  stack: ReactNode;
  /** Price or product card; sticks beside `desk` from lg up. */
  aside: ReactNode;
  /** Desk content beside the sticky aside (e.g. "Qué recibes"). */
  desk?: ReactNode | undefined;
};

const enter = (order: number): CSSProperties => ({ "--i": order }) as CSSProperties;

/**
 * "La mesa bajo el pequeño universo": the navy sky (live 3D scene) with the copy, a wave into
 * the cream desk, the worksheet stack straddling the boundary and a card that sticks beside the
 * desk content. Every item is placed explicitly on the grid (container queries on the section):
 * below lg the order is copy → real pages → price → desk, from lg the stack and the sticky card
 * take the right column.
 */
export function HeroScene({
  id,
  titleId,
  eyebrow,
  title,
  lead,
  children,
  actions,
  trust,
  stack,
  aside,
  desk,
}: Props) {
  return (
    <section id={id} data-slot="hero-scene" className="cq relative overflow-x-clip" aria-labelledby={titleId}>
      <div className="page-container grid grid-cols-1 cq-lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] cq-lg:gap-x-12">
        <div className="relative col-span-full row-start-1 w-[100cqw] justify-self-center overflow-hidden">
          <Universe variant="hero" />
          <WaveDivider fill="cream" className="absolute inset-x-0 -bottom-px" />
        </div>
        <div className="on-navy relative z-1 col-start-1 row-start-1 grid content-start justify-items-start gap-5 pt-10 pb-[calc(var(--wave-height)+var(--section-overlap)+1rem)] cq-sm:pt-14 cq-lg:pt-18 cq-lg:pb-[calc(var(--wave-height)+4rem)]">
          <div data-hero-enter="" style={enter(0)}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
          <h1 id={titleId} className="max-w-[20ch]" data-hero-enter="title" style={enter(1)}>
            {title}
          </h1>
          <p className="lead max-w-[54ch] text-pretty" data-hero-enter="" style={enter(2)}>
            {lead}
          </p>
          {children ? (
            <div className="grid w-full" data-hero-enter="" style={enter(3)}>
              {children}
            </div>
          ) : null}
          {actions ? (
            <div className="flex w-full flex-wrap items-center gap-3" data-hero-enter="" style={enter(4)}>
              {actions}
            </div>
          ) : null}
          {trust ? (
            <div data-hero-enter="" style={enter(5)}>
              {trust}
            </div>
          ) : null}
        </div>
        <div className="relative z-2 col-start-1 row-start-2 -mt-(--section-overlap) w-[min(17rem,72%)] justify-self-center cq-sm:w-90 cq-lg:col-start-2 cq-lg:row-start-1 cq-lg:mt-16 cq-lg:-mb-(--section-overlap) cq-lg:w-100 cq-lg:self-end cq-xl:w-120">
          {stack}
        </div>
        <div
          className="relative z-1 col-start-1 row-start-3 mt-10 w-full max-w-120 justify-self-center cq-lg:sticky cq-lg:top-[calc(var(--header-height)+1rem)] cq-lg:col-start-2 cq-lg:row-start-2 cq-lg:mt-[calc(var(--section-overlap)+2rem)] cq-lg:max-w-none cq-lg:self-start"
          data-hero-enter=""
          style={enter(3)}
        >
          {aside}
        </div>
        {desk ? (
          <div className="col-start-1 row-start-4 pt-12 pb-(--section-pad) cq-lg:row-start-2 cq-lg:pt-16">
            {desk}
          </div>
        ) : null}
      </div>
    </section>
  );
}
