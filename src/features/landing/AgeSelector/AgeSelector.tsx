"use client";

import { useId, useState, ViewTransition } from "react";
import { cx } from "@/lib/cx";
import { useMotionOK } from "@/motion/use-motion-ok";
import { useAge } from "./AgeContext";

type Option = { id: string; label: string; hint: string };

type Props = {
  legend: string;
  options: readonly Option[];
  /** Fallback selection when no `AgeProvider` is mounted. */
  initial: number;
  /** `light`: product-page variant pills on paper (default); `dark`: gold chips on the navy sky. */
  tone?: "light" | "dark" | undefined;
  className?: string | undefined;
};

/**
 * Variant pills on native radios (the look of a size selector in a product page): Base UI's
 * radio runtime would add ~20 KB gzip to the landing for three options.
 */
const CHIP = {
  light:
    "inline-grid min-h-12 w-full cursor-pointer place-items-center rounded-md border-2 border-line-strong bg-white px-4 text-base leading-none font-extrabold text-ink transition-[background-color,border-color,color,box-shadow] duration-(--duration-fast) ease-out peer-hover:border-navy peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-checked:shadow-[0_0_0_4px_oklch(0.3175_0.1094_256.25/14%)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
  dark: "inline-grid min-h-12 w-full cursor-pointer place-items-center rounded-pill border-2 border-white/28 bg-white/10 px-5 text-base leading-none font-extrabold text-white transition-[background-color,border-color,color] duration-(--duration-fast) ease-out peer-hover:border-gold peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
} as const;

/**
 * The age "variant" of the kit. Choosing one swaps the featured worksheet (through
 * `AgeProvider`) and the "where to start" line, announced politely with a view transition; the
 * title, price and URL never change.
 */
export function AgeSelector({ legend, options, initial, tone = "light", className }: Props) {
  const { selected, select } = useAge();
  const { ok } = useMotionOK();
  const name = useId();
  // The radios follow a synchronous copy of the choice: the shared selection updates inside a
  // transition (for the worksheet's view transition), and React would otherwise restore the old
  // controlled value right after the click, leaving the pill unchecked in WebKit.
  const [picked, setPicked] = useState(selected ?? initial);
  const current = picked;
  const hint = options[current]?.hint ?? "";

  return (
    <fieldset data-slot="age-selector" className={cx("grid min-w-0 gap-2.5", className)}>
      <legend className="mb-2.5 text-small font-extrabold text-heading">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option, index) => (
          <label key={option.id} className="relative inline-grid">
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={current === index}
              onChange={() => {
                setPicked(index);
                select(index);
              }}
              className="peer absolute inset-0 m-0 size-full cursor-pointer opacity-0"
            />
            <span className={CHIP[tone]}>{option.label}</span>
          </label>
        ))}
      </div>
      <ViewTransition default={ok ? "auto" : "none"}>
        <p
          className="min-h-[3em] max-w-[52ch] text-small font-semibold text-pretty text-body"
          aria-live="polite"
        >
          {hint}
        </p>
      </ViewTransition>
    </fieldset>
  );
}
