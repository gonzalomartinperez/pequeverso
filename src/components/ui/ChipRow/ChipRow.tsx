import type { ReactNode } from "react";
import styles from "./ChipRow.module.css";

type Props = {
  align?: "start" | "center";
  className?: string;
  children: ReactNode;
};

/** Wrapping row of chips (FactChip, Eyebrow) with a consistent gap. */
export function ChipRow({ align = "start", className, children }: Props) {
  return (
    <div className={`${styles.row} ${align === "center" ? styles.center : ""} ${className ?? ""}`}>
      {children}
    </div>
  );
}
