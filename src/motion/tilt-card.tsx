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

/** Pointer-follow is quick; the release eases back slowly so the card settles instead of snapping. */
const FOLLOW = "transform 140ms cubic-bezier(0.2, 0.7, 0.2, 1)";
const RELEASE = "transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)";

/**
 * Subtle 3D tilt that follows the pointer on fine pointers only (`pv-tilt` rules in motion.css).
 * A soft turquoise spotlight follows the pointer over the white glare. Decorative: no effect on
 * layout, keyboard or touch, and inert under reduced motion or Save-Data.
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
      el.style.transition = FOLLOW;
      el.style.setProperty("--tilt-rx", (-y).toFixed(3));
      el.style.setProperty("--tilt-ry", x.toFixed(3));
      el.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    });
  }, []);

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transition = RELEASE;
    el.style.setProperty("--tilt-rx", "0");
    el.style.setProperty("--tilt-ry", "0");
  }, []);

  const Tag = as;
  const style = max === undefined ? undefined : ({ "--tilt-max": `${max}deg` } as CSSProperties);
  return (
    <Tag
      ref={ref as never}
      data-slot="tilt-card"
      className={cx("pv-tilt group/tilt", className)}
      onPointerMove={active ? onMove : undefined}
      onPointerLeave={active ? reset : undefined}
      style={style}
    >
      {children}
      {active ? (
        <span
          className="pointer-events-none absolute inset-0 z-1 rounded-[inherit] bg-[radial-gradient(18rem_circle_at_var(--glare-x)_var(--glare-y),oklch(0.8521_0.0956_187.2/30%),transparent_65%)] opacity-0 transition-opacity duration-300 ease-out group-hover/tilt:opacity-100"
          aria-hidden="true"
        />
      ) : null}
    </Tag>
  );
}
