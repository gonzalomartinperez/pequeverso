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
 * Fanned 3D stack of three real worksheets over a soft gold glow. The featured page moves to the
 * front with a view transition when the age selection changes (instant under reduced motion).
 */
export function HeroStack({ pages, featured, className }: Props) {
  const { selected } = useAge();
  const { ok } = useMotionOK();
  const slots = slotsFor(pages.length, selected ?? featured);

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
