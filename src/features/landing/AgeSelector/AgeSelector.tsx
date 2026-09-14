"use client";

import { useId, ViewTransition } from "react";
import { useMotionOK } from "@/motion/useMotionOK";
import { useAge } from "./AgeContext";
import styles from "./AgeSelector.module.css";

type Option = { id: string; label: string; hint: string };

type Props = {
  legend: string;
  options: readonly Option[];
  /** Fallback selection when no `AgeProvider` is mounted. */
  initial: number;
  className?: string;
};

/**
 * Three age radios of the hero. Choosing one swaps the featured worksheet (through `AgeProvider`)
 * and the "where to start" line, announced politely; the title, price and URL never change.
 */
export function AgeSelector({ legend, options, initial, className }: Props) {
  const { selected, select } = useAge();
  const { ok } = useMotionOK();
  const name = useId();
  const current = selected ?? initial;
  const hint = options[current]?.hint ?? "";

  return (
    <fieldset className={`${styles.fieldset} ${className ?? ""}`}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option, index) => (
          <label key={option.id} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={current === index}
              onChange={() => select(index)}
              className={styles.input}
            />
            <span className={styles.chip}>{option.label}</span>
          </label>
        ))}
      </div>
      <ViewTransition default={ok ? "auto" : "none"}>
        <p className={styles.hint} aria-live="polite">
          {hint}
        </p>
      </ViewTransition>
    </fieldset>
  );
}
