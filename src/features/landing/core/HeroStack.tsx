"use client";

import { type CSSProperties, type ReactNode, ViewTransition } from "react";
import { useAge } from "@/features/landing/AgeSelector/AgeContext";
import { cx } from "@/lib/cx";
import { useMotionOK } from "@/motion/use-motion-ok";

export type StackPage = { id: string; node: ReactNode };

type Slot = "front" | "left" | "right";

type Props = {
  /** Three rendered worksheets (`MediaImage`), in age order; the featured one is shown in front. */
  pages: readonly StackPage[];
  /** Index shown in front when no `AgeProvider` selection exists. */
  featured: number;
  /**
   * `fan` (default): a 3D fan of three pages over a gold glow (home). `orbit`: the pages float
   * around a composition (landing gallery): the featured page large in front, the other two
   * smaller behind it. The parent positions the stack (`absolute inset-0` of its composition).
   */
  layout?: "fan" | "orbit" | undefined;
  /** Chip on the featured page in the `orbit` layout, one per page (e.g. "Hoja de ejemplo · 5 años"). */
  labels?: readonly string[] | undefined;
  className?: string | undefined;
};

const ENTER_ORDER = 2;
const PAGE =
  "absolute inset-0 overflow-hidden rounded-md bg-white shadow-lg [&_img]:size-full [&_img]:object-cover";
/**
 * The side pages fan out behind the front one inside the stack's perspective, scaled so their
 * painted area stays below the hero text: a late front page never hands LCP to a lazy side page.
 */
const SLOT: Record<Slot, string> = {
  front: "z-3",
  left: "z-1 -translate-x-[26%] -translate-z-30 -rotate-y-14 scale-82",
  right: "z-2 translate-x-[26%] -translate-z-22 rotate-y-12 scale-82",
};

/** Orbit layout: explicit places inside the composition box (percentages of its size). */
const ORBIT_SLOT: Record<Slot, string> = {
  front: "z-30 left-[1%] bottom-[5%] w-[43%] -rotate-[5deg]",
  left: "z-5 left-[3%] top-[11%] w-[29%] -rotate-[9deg] opacity-95",
  right: "z-5 right-[0%] top-[15%] w-[30%] rotate-[7deg] opacity-95",
};
const ORBIT_PAGE =
  "absolute aspect-[4/3] rounded-[clamp(0.5rem,1.6cqw,0.9rem)] bg-white p-[clamp(3px,0.9cqw,6px)] shadow-float [&_img]:size-full [&_img]:rounded-[clamp(0.35rem,1.2cqw,0.6rem)] [&_img]:object-cover [&_picture]:contents";

function slotsFor(count: number, front: number): Slot[] {
  const slots: Slot[] = Array.from({ length: count }, () => "front");
  [...slots.keys()]
    .filter((index) => index !== front)
    .forEach((index, order) => {
      slots[index] = order === 0 ? "left" : "right";
    });
  return slots;
}

/**
 * Real worksheets for the selected age. The featured page moves to the front with a view
 * transition when the age selection changes (instant under reduced motion).
 */
export function HeroStack({ pages, featured, layout = "fan", labels, className }: Props) {
  const { selected } = useAge();
  const { ok } = useMotionOK();
  const current = selected ?? featured;
  const slots = slotsFor(pages.length, current);

  if (layout === "orbit") {
    const label = labels?.[current];
    return (
      <div data-slot="hero-stack" data-layout="orbit" className={cx("absolute inset-0", className)}>
        {pages.map((page, index) => {
          const slot = slots[index] ?? "front";
          return (
            <ViewTransition key={page.id} default={ok ? "auto" : "none"}>
              <div className={cx(ORBIT_PAGE, ORBIT_SLOT[slot])} data-slot={slot}>
                {page.node}
                {slot === "front" && label ? (
                  <span className="absolute -bottom-3 left-1/2 max-w-[92%] -translate-x-1/2 truncate rounded-pill bg-navy px-3 py-1 text-[clamp(0.6875rem,2.2cqw,0.8125rem)] font-extrabold text-white shadow-md">
                    {label}
                  </span>
                ) : null}
              </div>
            </ViewTransition>
          );
        })}
      </div>
    );
  }

  return (
    <div
      data-slot="hero-stack"
      className={cx("relative aspect-[4/3] perspective-(--tilt-perspective) transform-3d", className)}
      data-hero-enter="media"
      style={{ "--i": ENTER_ORDER } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="absolute inset-[-12%] -translate-z-40 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--pv-gold)_30%,transparent),transparent)]"
      />
      {pages.map((page, index) => {
        const slot = slots[index] ?? "front";
        return (
          <ViewTransition key={page.id} default={ok ? "auto" : "none"}>
            <div className={cx(PAGE, SLOT[slot])} data-slot={slot}>
              {page.node}
            </div>
          </ViewTransition>
        );
      })}
    </div>
  );
}
