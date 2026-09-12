import type { ReactNode } from "react";
import styles from "./Topbar.module.css";

type Props = { items?: readonly string[]; children?: ReactNode; tone?: "navy" | "mint" };

/** Thin factual strip above the header (counts, confirmation state). */
export function Topbar({ items = [], children, tone = "navy" }: Props) {
  return (
    <div className={`${styles.topbar} ${styles[tone]}`}>
      <div className={`container ${styles.inner}`}>
        {children ??
          items.map((item, index) => (
            <span key={item} className={styles.item}>
              {index > 0 ? <span className={styles.dot} aria-hidden="true" /> : null}
              {item}
            </span>
          ))}
      </div>
    </div>
  );
}
