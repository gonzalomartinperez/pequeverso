"use client";

import { useId, ViewTransition } from "react";
import { cx } from "@/lib/cx";
import { useMotionOK } from "@/motion/use-motion-ok";
import { useAge } from "./AgeContext";

type Option = { id: string; label: string; hint: string };

type Props = {
  legend: string;
  options: readonly Option[];
  /** Fallback selection when no `AgeProvider` is mounted. */
  initial: number;
  className?: string | undefined;
};

/**
 * Chip radios on the navy sky, the `RadioGroup variant="chip"` look (gold when checked) on native
 * inputs: Base UI's radio runtime would add ~20 KB gzip to the landing for three options.
 */
const CHIP =
  "inline-grid min-h-11 min-w-14 cursor-pointer place-items-center rounded-pill border-2 border-white/28 bg-white/10 px-5 text-base leading-none font-extrabold text-white transition-[background-color,border-color,color] duration-(--duration-fast) ease-out peer-hover:border-gold peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring";

/**
 * Three age chips of the hero. Choosing one swaps the featured worksheet (through `AgeProvider`)
 * and the "where to start" line, announced politely with a view transition; the title, price and
 * URL never change.
 */
export function AgeSelector({ legend, options, initial, className }: Props) {
  const { selected, select } = useAge();
  const { ok } = useMotionOK();
  const name = useId();
  const current = selected ?? initial;
  const hint = options[current]?.hint ?? "";

  return (
    <fieldset data-slot="age-selector" className={cx("grid min-w-0 gap-2", className)}>
      <legend className="mb-2 text-small font-extrabold text-heading">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <label key={option.id} className="relative inline-grid">
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={current === index}
              onChange={() => select(index)}
              className="peer absolute inset-0 m-0 size-full cursor-pointer opacity-0"
            />
            <span className={CHIP}>{option.label}</span>
          </label>
        ))}
      </div>
      <ViewTransition default={ok ? "auto" : "none"}>
        <p className="min-h-[3.2em] max-w-[52ch] text-small font-semibold text-pretty" aria-live="polite">
          {hint}
        </p>
      </ViewTransition>
    </fieldset>
  );
}
