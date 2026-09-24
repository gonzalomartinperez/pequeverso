"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";
import { useMotionOK } from "./use-motion-ok";

type Props = {
  value: number;
  /** Formats the displayed number (defaults to `String`). */
  format?: ((value: number) => string) | undefined;
  className?: string | undefined;
};

const DURATION_MS = 900;

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Number that counts from 0 to `value` over 900 ms when it enters the viewport. The server
 * renders the final value in tabular figures with reserved width; reduced motion skips the count.
 */
export function Counter({ value, format = String, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { ok } = useMotionOK();

  useEffect(() => {
    const el = ref.current;
    if (!el || !ok) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / DURATION_MS);
          el.textContent = format(Math.round(value * easeOut(progress)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = format(value);
    };
  }, [value, format, ok]);

  const text = format(value);
  return (
    <span
      ref={ref}
      data-slot="counter"
      className={cx("inline-block text-end tabular-nums", className)}
      style={{ minWidth: `${text.length}ch` }}
    >
      {text}
    </span>
  );
}
