import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = {
  children: ReactNode;
  /** Phase offset in seconds so neighbours do not bob in sync. */
  delay?: number | undefined;
  /** Travel in px (default 12). */
  range?: number | undefined;
  /** Static tilt in degrees (kept under reduced motion). */
  rotate?: number | undefined;
  className?: string | undefined;
};

/** Decorative wrapper that bobs its child like a planet (`.pv-float`); still under reduced motion. */
export function Float({ children, delay = 0, range, rotate, className }: Props) {
  const style = {
    "--float-delay": `${-Math.abs(delay)}s`,
    ...(range ? { "--float-range": `${range}px` } : {}),
    ...(rotate ? { rotate: `${rotate}deg` } : {}),
  } as CSSProperties;
  return (
    <div data-slot="float" className={cx("pv-float", className)} style={style}>
      {children}
    </div>
  );
}
