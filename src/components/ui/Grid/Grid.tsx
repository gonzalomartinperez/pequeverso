import type { CSSProperties, ReactNode } from "react";
import styles from "./Grid.module.css";

type Props = {
  /** Columns at the widest container; narrower containers step down (container queries). */
  cols?: 2 | 3 | 4;
  /** Minimum column width (CSS length); when set, columns auto-fit instead of following `cols`. */
  min?: string;
  gap?: 3 | 4 | 5 | 6;
  as?: "div" | "ul" | "ol";
  className?: string;
  children: ReactNode;
};

const COLS_CLASS = { 2: "cols2", 3: "cols3", 4: "cols4" } as const;
const GAP_CLASS = { 3: "gap3", 4: "gap4", 5: "gap5", 6: "gap6" } as const;

/** Responsive grid driven by its own container width, so pages never write media queries. */
export function Grid({ cols = 3, min, gap = 5, as = "div", className, children }: Props) {
  const Tag = as;
  const style = min ? ({ "--grid-min": min } as CSSProperties) : undefined;
  return (
    <div className={`${styles.host} ${className ?? ""}`}>
      <Tag
        className={`${styles.grid} ${min ? styles.auto : styles[COLS_CLASS[cols]]} ${styles[GAP_CLASS[gap]]}`}
        style={style}
        role={as === "div" ? undefined : "list"}
      >
        {children}
      </Tag>
    </div>
  );
}
