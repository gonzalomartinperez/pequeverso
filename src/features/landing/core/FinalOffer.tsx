import type { ReactNode } from "react";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { Accent, GoldStar, SyllableTile } from "./parts";

type Props = {
  titleId: string;
  kicker: string;
  title: string;
  titleAccent?: string | undefined;
  checks: readonly string[];
  cta: ReactNode;
  /** "US$14,99 · pago único" (formatted by the page from the registry). */
  priceLine: string;
  currencyNote: string;
  note: string;
  /** Transparent cut-out of the closing band (a child celebrating a finished sheet). */
  image: string;
};

/** Closing band content on navy: the last call to action beside a celebrating child. */
export function FinalOffer({
  titleId,
  kicker,
  title,
  titleAccent,
  checks,
  cta,
  priceLine,
  currencyNote,
  note,
  image,
}: Props) {
  return (
    <div className="grid items-center gap-10 cq-lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="grid content-center justify-items-start gap-6" data-reveal="blur">
        <Eyebrow>{kicker}</Eyebrow>
        <h2 id={titleId} className="max-w-[16ch] text-[clamp(2.375rem,1.6rem+3vw,4.5rem)] leading-[1.02]">
          <Accent text={title} accent={titleAccent} tone="sky" />
        </h2>
        <ul className="grid gap-2.5" role="list">
          {checks.map((check) => (
            <li key={check} className="flex items-start gap-3 font-bold">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-turquoise/18 text-turquoise">
                <Icon name="check" size={15} strokeWidth={2.8} />
              </span>
              <span>{check}</span>
            </li>
          ))}
        </ul>
        <div className="grid w-full gap-3 cq-sm:w-auto">
          {cta}
          <p className="text-small font-extrabold text-gold">{priceLine}</p>
          <p className="text-small text-pretty">
            {currencyNote} {note}
          </p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="cq relative mx-auto aspect-square w-full max-w-[20rem] cq-lg:max-w-md"
      >
        <div
          className="absolute inset-[8%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 34% 30%, oklch(0.95 0.06 95) 0%, var(--pv-gold) 36%, oklch(0.72 0.14 80) 100%)",
            boxShadow: "0 0 120px 10px oklch(0.8908 0.1645 93.89 / 28%)",
          }}
        />
        <div className="absolute top-[34%] -left-[6%] h-[26%] w-[112%] -rotate-12 rounded-[50%] border-2 border-dashed border-white/30" />
        <div className="absolute inset-x-[14%] bottom-[2%] z-10 [&_img]:h-auto [&_img]:w-full [&_picture]:contents">
          <MediaImage id={image} sizes="(min-width: 1024px) 340px, 70vw" alt="" />
        </div>
        <SyllableTile tone="turquoise" delay={1} rotate={-8} className="top-[10%] left-[2%] z-20">
          PE
        </SyllableTile>
        <SyllableTile tone="white" delay={3.2} rotate={8} className="right-[0%] bottom-[22%] z-20">
          RRO
        </SyllableTile>
        <GoldStar delay={2} className="top-[2%] right-[14%] z-20 size-10" />
      </div>
    </div>
  );
}
