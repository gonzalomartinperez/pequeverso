import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Props = {
  /** Up to six cards; each becomes a sticky layer. */
  items: readonly ReactNode[];
  className?: string;
};

/**
 * Cards that stick under the header and pile up: as the next card slides over, the previous
 * one scales back on a view timeline (`pv-stack` rules in motion.css). Plain vertical stack
 * without view-timeline support.
 */
export function StickyStack({ items, className }: Props) {
  return (
    <ol data-slot="sticky-stack" className={cx("pv-stack grid gap-6", className)} role="list">
      {items.map((item, index) => (
        <li key={`stack-${String(index)}`} className="pv-stack-item">
          {item}
        </li>
      ))}
    </ol>
  );
}
