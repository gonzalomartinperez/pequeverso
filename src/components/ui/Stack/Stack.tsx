import type { CSSProperties, ReactNode } from "react";
import styles from "./Stack.module.css";

type Props = {
  /** Vertical rhythm as a spacing step (`--space-<gap>`). */
  gap?: 2 | 3 | 4 | 5 | 6;
  /** Optional measure, e.g. "62ch". */
  maxWidth?: string;
  align?: "start" | "center";
  as?: "div" | "header" | "section" | "article";
  id?: string;
  className?: string;
  children: ReactNode;
};

const GAP_CLASS = { 2: "gap2", 3: "gap3", 4: "gap4", 5: "gap5", 6: "gap6" } as const;

/** Vertical flow with a consistent gap and an optional measure. */
export function Stack({ gap = 4, maxWidth, align = "start", as = "div", id, className, children }: Props) {
  const Tag = as;
  const style = maxWidth ? ({ "--stack-max": maxWidth } as CSSProperties) : undefined;
  return (
    <Tag
      id={id}
      className={`${styles.stack} ${styles[GAP_CLASS[gap]]} ${align === "center" ? styles.center : ""} ${className ?? ""}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
