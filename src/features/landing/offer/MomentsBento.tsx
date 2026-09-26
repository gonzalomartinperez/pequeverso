import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { cn } from "@/lib/utils";
import { Float } from "@/motion/float";

type Moment = { icon: IconName; title: string; text: string };

type Props = {
  items: readonly Moment[];
  /** A real page shown in the centre tile (`pack.page.*`). */
  pageId: string;
};

const TONES = [
  "bg-[linear-gradient(160deg,var(--pv-white),var(--pv-peach))]",
  "bg-[linear-gradient(160deg,var(--pv-white),var(--pv-celeste))]",
  "bg-[linear-gradient(160deg,var(--pv-white),var(--pv-mint))]",
  "bg-[linear-gradient(160deg,var(--pv-white),var(--pv-lemon))]",
] as const;

const AREAS = ["lg:[grid-area:m0]", "lg:[grid-area:m1]", "lg:[grid-area:m2]", "lg:[grid-area:m3]"] as const;

/**
 * "Para qué momentos" as a bento: four moment tiles around a centre tile with a real page floating
 * in it (the page is decorative here; the wall above carries the named pages).
 */
export function MomentsBento({ items, pageId }: Props) {
  return (
    <ul
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 lg:gap-5 lg:[grid-template-areas:'m0_page_m1''m2_page_m3']"
      role="list"
    >
      {items.map((item, index) => (
        <li
          key={item.title}
          data-reveal=""
          style={{ "--i": index % 2 } as CSSProperties}
          className={cn(
            "on-light grid content-start gap-4 rounded-2xl border border-white/80 p-6 shadow-[0_18px_40px_-24px_oklch(0.3175_0.1094_256.25/0.4)] sm:p-7",
            TONES[index % TONES.length],
            AREAS[index % AREAS.length],
          )}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="grid size-13 place-items-center rounded-lg bg-navy text-gold shadow-md">
              <Icon name={item.icon} size={24} strokeWidth={2.2} />
            </span>
            <span aria-hidden="true" className="font-display text-[2rem] leading-none font-bold text-navy/15">
              {String(index + 1).padStart(2, "0")}
            </span>
          </span>
          <h3 className="font-display text-[1.4rem] leading-tight font-bold">{item.title}</h3>
          <p>{item.text}</p>
        </li>
      ))}
      <li
        aria-hidden="true"
        className="relative hidden place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_40%,var(--pv-celeste),var(--pv-blue-soft)_60%,var(--pv-sky))] p-8 lg:grid lg:[grid-area:page]"
      >
        <div className="absolute top-10 left-10 size-16 rounded-full planet-gold opacity-80" />
        <div className="absolute right-8 bottom-12 size-8 rounded-full planet-turquoise" />
        <Float rotate={-4} range={10} className="w-[70%]">
          <span className="block overflow-hidden rounded-lg border-4 border-white bg-white shadow-float [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:object-cover">
            <MediaImage id={pageId} alt="" sizes="280px" />
          </span>
        </Float>
      </li>
    </ul>
  );
}
