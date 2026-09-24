"use client";

import { type ReactNode, startTransition, useId, useState, ViewTransition } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cx } from "@/lib/cx";
import { useMotionOK } from "./use-motion-ok";

type Props = {
  front: ReactNode;
  back: ReactNode;
  /** Accessible label of the toggle while the front is shown. */
  showLabel?: string;
  /** Accessible label of the toggle while the back is shown. */
  hideLabel?: string;
  ratio?: "4/3" | "3/4" | "16/9";
  className?: string;
};

const RATIO = { "4/3": "aspect-[4/3]", "3/4": "aspect-[3/4]", "16/9": "aspect-video" } as const;
const FACE =
  "absolute inset-0 overflow-hidden rounded-[inherit] bg-card shadow-md backface-hidden [&_img]:size-full [&_img]:object-cover";

/**
 * Two-faced preview flipped with a view transition (rotateY, half a reveal each way) inside
 * a perspective container; the hidden face is inert. Reduced motion swaps instantly.
 */
export function FlipPreview({
  front,
  back,
  showLabel = "Ver el reverso",
  hideLabel = "Ver el frente",
  ratio = "4/3",
  className,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const { ok } = useMotionOK();
  const id = useId();
  const toggle = () => startTransition(() => setFlipped((state) => !state));

  return (
    <div
      data-slot="flip-preview"
      className={cx("grid justify-items-center gap-3 perspective-(--tilt-perspective)", className)}
    >
      <ViewTransition default={ok ? "pv-flip" : "none"}>
        <div
          id={id}
          className={cx("relative w-full rounded-lg transform-3d", RATIO[ratio], flipped && "rotate-y-180")}
        >
          <div className={FACE} inert={flipped} aria-hidden={flipped}>
            {front}
          </div>
          <div className={cx(FACE, "rotate-y-180")} inert={!flipped} aria-hidden={!flipped}>
            {back}
          </div>
        </div>
      </ViewTransition>
      <button
        type="button"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        aria-expanded={flipped}
        aria-controls={id}
        onClick={toggle}
      >
        {flipped ? hideLabel : showLabel}
      </button>
    </div>
  );
}
