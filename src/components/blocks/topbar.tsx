import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = { items?: readonly string[]; children?: ReactNode; tone?: "navy" | "mint"; className?: string };

/** Thin factual strip above the header (counts, confirmation state). */
export function Topbar({ items = [], children, tone = "navy", className }: Props) {
  return (
    <div
      data-slot="topbar"
      className={cn(
        "text-tiny font-bold tracking-[0.02em]",
        tone === "navy" ? "bg-navy-deep text-white" : "bg-mint text-navy",
        className,
      )}
    >
      <div className="page-container flex min-h-9 flex-wrap items-center justify-center gap-x-3 gap-y-2 py-1 text-center">
        {children ??
          items.map((item, index) => (
            <span key={item} className="inline-flex items-center gap-3">
              {index > 0 ? <span className="size-1 rounded-full bg-gold" aria-hidden="true" /> : null}
              {item}
            </span>
          ))}
      </div>
    </div>
  );
}
