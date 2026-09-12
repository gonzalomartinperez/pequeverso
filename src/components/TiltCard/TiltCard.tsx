"use client";

import { type CSSProperties, type PointerEvent, type ReactNode, useCallback, useRef } from "react";
import styles from "./TiltCard.module.css";

type Props = { children: ReactNode; className?: string; max?: number; as?: "div" | "article" | "figure" };

/**
 * Subtle 3D tilt that follows the pointer (desktop, fine pointers only). Purely
 * decorative: no effect on layout, keyboard or touch, and disabled under reduced motion.
 */
export function TiltCard({ children, className, max = 6, as = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);

  const onMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const el = ref.current;
      if (!el || event.pointerType !== "mouse") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty("--tilt-x", `${(-y * max).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(x * max).toFixed(2)}deg`);
        el.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
      });
    },
    [max],
  );

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }, []);

  const Tag = as;
  return (
    <Tag
      ref={ref as never}
      className={`${styles.tilt} ${className ?? ""}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ "--tilt-x": "0deg", "--tilt-y": "0deg" } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
