import type { ReactNode } from "react";
import styles from "./StickyStack.module.css";

type Props = {
  /** Up to six cards; each becomes a sticky layer. */
  items: readonly ReactNode[];
  className?: string;
};

/**
 * Cards that stick under the header and pile up: as the next card slides over, the previous
 * one scales back on a view timeline. Plain vertical stack without view-timeline support.
 */
export function StickyStack({ items, className }: Props) {
  return (
    <ol className={`${styles.stack} ${className ?? ""}`} role="list">
      {items.map((item, index) => (
        <li key={`stack-${String(index)}`} className={styles.item}>
          {item}
        </li>
      ))}
    </ol>
  );
}
