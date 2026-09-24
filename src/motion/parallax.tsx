import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = {
  children: ReactNode;
  /** Direction of travel while scrolling down; "up" moves against the scroll. */
  direction?: "up" | "down";
  className?: string;
};

/**
 * Scroll-linked drift of ±`--parallax-range` on a view timeline (transform only). The wrapper
 * reserves the travel distance so nothing overlaps; static where view timelines are missing.
 */
export function Parallax({ children, direction = "up", className }: Props) {
  return (
    <div data-slot="parallax" className={cx("py-(--parallax-range)", className)}>
      <div className="pv-parallax-layer" data-direction={direction}>
        {children}
      </div>
    </div>
  );
}
