"use client";

import { type CSSProperties, type ReactNode, ViewTransition } from "react";
import { useAge } from "@/features/landing/AgeSelector/AgeContext";
import { Orbit } from "@/motion/Orbit";
import { useMotionOK } from "@/motion/useMotionOK";
import styles from "./HeroStack.module.css";

export type StackPage = { id: string; node: ReactNode };

type Slot = "front" | "left" | "right";

type Props = {
  /** Three rendered worksheets (`MediaImage`), in age order; the featured one is shown in front. */
  pages: readonly StackPage[];
  /** Index shown in front when no `AgeProvider` selection exists. */
  featured: number;
  className?: string;
};

const ENTER_ORDER = 2;

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
 * Fanned 3D stack of three worksheets under the gold-star orbit. The featured page moves to the
 * front with a view transition when the age selection changes (instant under reduced motion).
 */
export function HeroStack({ pages, featured, className }: Props) {
  const { selected } = useAge();
  const { ok } = useMotionOK();
  const slots = slotsFor(pages.length, selected ?? featured);

  return (
    <div
      className={`${styles.scene} ${className ?? ""}`}
      data-hero-enter="media"
      style={{ "--i": ENTER_ORDER } as CSSProperties}
    >
      <div className={styles.orbit} aria-hidden="true">
        <Orbit />
      </div>
      {pages.map((page, index) => (
        <ViewTransition key={page.id} default={ok ? "auto" : "none"}>
          <div className={`${styles.page} ${styles[slots[index] ?? "front"]}`} data-slot={slots[index]}>
            {page.node}
          </div>
        </ViewTransition>
      ))}
    </div>
  );
}
