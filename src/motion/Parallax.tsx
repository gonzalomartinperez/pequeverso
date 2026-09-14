import type { ReactNode } from "react";
import styles from "./Parallax.module.css";

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
    <div className={`${styles.wrapper} ${className ?? ""}`}>
      <div className={`${styles.layer} ${direction === "down" ? styles.down : ""}`}>{children}</div>
    </div>
  );
}
