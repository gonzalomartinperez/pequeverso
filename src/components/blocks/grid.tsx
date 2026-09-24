import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Columns at the widest container; narrower containers step down (container queries). */
  cols?: 2 | 3 | 4 | undefined;
  /** Minimum column width (CSS length); when set, columns auto-fit instead of following `cols`. */
  min?: string | undefined;
  gap?: 3 | 4 | 5 | 6 | undefined;
  as?: "div" | "ul" | "ol" | undefined;
  className?: string | undefined;
  children: ReactNode;
};

const COLS = {
  2: "cq-sm:grid-cols-2",
  3: "cq-sm:grid-cols-2 cq-md:grid-cols-3",
  4: "cq-sm:grid-cols-2 cq-md:grid-cols-3 cq-lg:grid-cols-4",
} as const;
const GAP = { 3: "gap-3", 4: "gap-4", 5: "gap-6", 6: "gap-8" } as const;

/** Responsive grid driven by its own container width (sm 640 · md 768 · lg 1024). */
export function Grid({ cols = 3, min, gap = 5, as: Tag = "div", className, children }: Props) {
  const style = min ? ({ "--grid-min": min } as CSSProperties) : undefined;
  return (
    <div data-slot="grid" className={cn("cq", className)}>
      <Tag
        className={cn(
          "grid grid-cols-1 [&>*]:min-w-0",
          min ? "grid-cols-[repeat(auto-fit,minmax(min(var(--grid-min),100%),1fr))]" : COLS[cols],
          GAP[gap],
        )}
        style={style}
        role={Tag === "div" ? undefined : "list"}
      >
        {children}
      </Tag>
    </div>
  );
}
