import type { ReactNode } from "react";
import styles from "./Split.module.css";

type Ratio = "1/1" | "1.1/0.9" | "0.9/1.1" | "1.2/0.8" | "0.8/1.2";

type Props = {
  /** Width ratio of the first and second child from md up. */
  ratio?: Ratio;
  align?: "start" | "center" | "stretch";
  /** Keeps the second child in view while the first scrolls (md up). */
  stickyAside?: boolean;
  /** Shows the second child (media) first on tablet-width containers only. */
  mediaFirstOnTablet?: boolean;
  className?: string;
  /** Exactly two children: copy first, media or aside second. */
  children: [ReactNode, ReactNode];
};

const RATIO_CLASS: Record<Ratio, string> = {
  "1/1": "r11",
  "1.1/0.9": "r1109",
  "0.9/1.1": "r0911",
  "1.2/0.8": "r1208",
  "0.8/1.2": "r0812",
};

/** Two-column layout that collapses by container width (copy → media on phones). */
export function Split({
  ratio = "1/1",
  align = "start",
  stickyAside = false,
  mediaFirstOnTablet = false,
  className,
  children,
}: Props) {
  const classes = [
    styles.split,
    styles[RATIO_CLASS[ratio]],
    styles[align],
    stickyAside ? styles.sticky : "",
    mediaFirstOnTablet ? styles.mediaFirst : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`${styles.host} ${className ?? ""}`}>
      <div className={classes}>{children}</div>
    </div>
  );
}
