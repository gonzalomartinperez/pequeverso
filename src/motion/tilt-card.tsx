"use client";

import { type CSSProperties, type PointerEvent, type ReactNode, useCallback, useRef } from "react";
import { cx } from "@/lib/cx";
import { useMotionOK } from "./use-motion-ok";

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees; defaults to the `--tilt-max` token. */
  max?: number;
  as?: "div" | "article" | "figure";
};

/**
 * Subtle 3D tilt that follows the pointer on fine pointers only (`pv-tilt` rules in motion.css).
 * Decorative: no effect on layout, keyboard or touch, and inert under reduced motion or Save-Data.
 */
export function TiltCard({ children, className, max, as = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);
  const motion = useMotionOK();
  const active = motion.ok && motion.finePointer;

  const onMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--tilt-rx", (-y).toFixed(3));
      el.style.setProperty("--tilt-ry", x.toFixed(3));
      el.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    });
  }, []);

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-rx", "0");
    el.style.setProperty("--tilt-ry", "0");
  }, []);

  const Tag = as;
  const style = max === undefined ? undefined : ({ "--tilt-max": `${max}deg` } as CSSProperties);
  return (
    <Tag
      ref={ref as never}
      data-slot="tilt-card"
      className={cx("pv-tilt", className)}
      onPointerMove={active ? onMove : undefined}
      onPointerLeave={active ? reset : undefined}
      style={style}
    >
      {children}
    </Tag>
  );
}
