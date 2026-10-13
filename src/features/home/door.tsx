import { hubCopy } from "@content/es/hub";
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import type { HubNeed } from "@/features/hub/hub-products";
import { cn } from "@/lib/utils";

/** Accent per need: reading lives on sky and teal, first meals on peach and rose. */
export const NEED_TONE = {
  reading: {
    stage: "bg-[linear-gradient(160deg,var(--pv-celeste),var(--pv-white)_75%)]",
    glow: "bg-[radial-gradient(closest-side,oklch(0.8521_0.0956_187.2/55%),transparent)]",
    chip: "bg-mint text-teal-text",
    icon: "book",
  },
  feeding: {
    stage: "bg-[linear-gradient(160deg,var(--pv-peach),var(--pv-rose)_45%,var(--pv-white))]",
    glow: "bg-[radial-gradient(closest-side,oklch(0.9483_0.0301_55.6),transparent)]",
    chip: "bg-peach text-navy",
    icon: "utensils",
  },
} as const;

const DOOR_SIZES = "(min-width: 1024px) 280px, (min-width: 640px) 44vw, 46vw";

type Props = {
  need: HubNeed;
  /** The reading door carries the hero's one priority image; the other is eager, never preloaded. */
  priority?: boolean;
  /** Order in the hero entrance (`--i`). */
  order: number;
  /** id of the disclosure that describes this door (affiliate course). */
  describedBy?: string | undefined;
};

/**
 * A «puerta»: one need as a large card that is entirely one link to its chapter on the home
 * (`#leer`, `#bebe`), so it works before hydration and in in-app browsers. Real product photo,
 * stage chip, the task in display type, product and format, and a single visual action. Both doors
 * share this component, size and treatment (navy action, never coral). Hover lifts the card,
 * zooms the photo and nudges the arrow; all transform-only and off under reduced motion.
 */
export function Door({ need, priority = false, order, describedBy }: Props) {
  const tone = NEED_TONE[need.key];
  return (
    <a
      href={need.anchor}
      aria-describedby={describedBy}
      data-door={need.key}
      data-hero-enter="media"
      style={{ "--i": order } as CSSProperties}
      className="group/door relative grid h-full grid-cols-1 overflow-hidden rounded-xl bg-white text-ink no-underline shadow-float ring-1 ring-line transition-[translate,box-shadow] duration-(--duration) ease-out hover:ring-teal/40 motion-safe:hover:-translate-y-1.5 cq-lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] cq-lg:rounded-2xl"
    >
      <span
        className={cn(
          "relative block overflow-hidden",
          tone.stage,
          "[&_img]:aspect-[4/3] [&_img]:h-auto [&_img]:w-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-out motion-safe:group-hover/door:[&_img]:scale-[1.05] cq-lg:[&_img]:aspect-auto cq-lg:[&_img]:h-full",
          need.recommended ? "[&_img]:object-[60%_30%]" : "[&_img]:object-[0%_50%]",
        )}
      >
        {priority ? (
          <MediaImage id={need.photo} sizes={DOOR_SIZES} priority />
        ) : (
          <MediaImage id={need.photo} sizes={DOOR_SIZES} eager />
        )}
        {need.recommended ? (
          <span className="absolute top-2 left-2 rounded-pill bg-white/92 px-2.5 py-0.5 text-tiny font-extrabold text-ink shadow-sm cq-sm:top-3 cq-sm:left-3">
            {hubCopy.feeding.recommended}
          </span>
        ) : null}
      </span>
      <span className="grid content-between gap-3 p-3 cq-sm:p-5 cq-lg:p-6">
        <span className="grid gap-2">
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-tiny font-extrabold",
              tone.chip,
            )}
          >
            <Icon name={tone.icon} size={14} strokeWidth={2.6} />
            {need.stage}
          </span>
          <span className="font-display text-[clamp(1.25rem,1rem+1.2vw,1.875rem)] leading-[1.08] font-bold text-heading text-balance">
            {need.need}
          </span>
          <span className="hidden text-small text-pretty text-body cq-sm:block">{need.line}</span>
          <span className="text-tiny font-bold text-subtle cq-sm:text-small">
            <span className="hidden cq-sm:inline">{need.name} · </span>
            {need.format}
          </span>
        </span>
        <DoorAction>{need.go}</DoorAction>
      </span>
    </a>
  );
}

/** The door's single visual action: a navy pill (the whole card is the link). */
function DoorAction({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-pill bg-navy px-4 text-small font-extrabold text-white shadow-[0_14px_28px_-14px_oklch(0.3175_0.1094_256.25/70%)] transition-colors duration-(--duration) group-hover/door:bg-navy-deep group-hover/door:text-gold cq-sm:w-fit cq-sm:px-5 cq-sm:text-base">
      {children}
      <Icon
        name="arrowDown"
        size={18}
        strokeWidth={2.6}
        className="transition-transform duration-(--duration) ease-out motion-safe:group-hover/door:translate-y-0.5"
      />
    </span>
  );
}
