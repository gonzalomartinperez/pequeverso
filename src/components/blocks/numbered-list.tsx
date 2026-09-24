import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Props = { items: readonly string[]; tone?: "light" | "dark"; className?: string };

/** Ordered list of short instructions with a numbered disc per step (the number is decorative; the <ol> carries the order). */
export function NumberedList({ items, tone = "light", className }: Props) {
  return (
    <ol
      data-slot="numbered-list"
      className={cn("grid gap-4", tone === "dark" && "on-navy", className)}
      role="list"
    >
      {items.map((item, index) => (
        <li
          key={item}
          className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 font-semibold text-body"
          data-reveal=""
          style={{ "--i": index } as CSSProperties}
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-gold font-display text-lg leading-none font-bold text-ink"
          >
            {index + 1}
          </span>
          <span className="pt-1.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}
