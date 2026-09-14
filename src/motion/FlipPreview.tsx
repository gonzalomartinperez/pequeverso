"use client";

import { type ReactNode, startTransition, useId, useState, ViewTransition } from "react";
import styles from "./FlipPreview.module.css";
import { useMotionOK } from "./useMotionOK";

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

const RATIO_CLASS = { "4/3": "ratio43", "3/4": "ratio34", "16/9": "ratio169" } as const;

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
    <div className={`${styles.scene} ${className ?? ""}`}>
      <ViewTransition default={ok ? "pv-flip" : "none"}>
        <div
          id={id}
          className={`${styles.card} ${styles[RATIO_CLASS[ratio]]} ${flipped ? styles.flipped : ""}`}
        >
          <div className={styles.face} inert={flipped} aria-hidden={flipped}>
            {front}
          </div>
          <div className={`${styles.face} ${styles.back}`} inert={!flipped} aria-hidden={!flipped}>
            {back}
          </div>
        </div>
      </ViewTransition>
      <button
        type="button"
        className="button button--ghost button--small"
        aria-expanded={flipped}
        aria-controls={id}
        onClick={toggle}
      >
        {flipped ? hideLabel : showLabel}
      </button>
    </div>
  );
}
