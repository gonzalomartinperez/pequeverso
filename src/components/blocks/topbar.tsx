import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TopbarTone = "navy" | "mint";

type Props = { items?: readonly string[]; children?: ReactNode; tone?: TopbarTone; className?: string };

/**
 * Slim factual strip above the header (counts, confirmation state). Navy: deep sky with a thin
 * gold → turquoise hairline and gold dot separators; below sm only the first two facts show so
 * the strip stays on one line. Mint: a soft mint → celeste wash for post-purchase states.
 * Static on purpose: moving text in a strip this small would need its own pause control.
 */
export function Topbar({ items = [], children, tone = "navy", className }: Props) {
  return (
    <div
      data-slot="topbar"
      data-tone={tone}
      className={cn(
        "relative text-tiny font-bold tracking-[0.02em]",
        tone === "navy"
          ? "bg-navy-deep text-white/90 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gold/25"
          : "bg-mint text-navy",
        className,
      )}
    >
      <div
        className={cn(
          "page-container flex min-h-8 items-center justify-center gap-x-3 gap-y-1 py-1 text-center",
          children ? "flex-wrap" : "flex-wrap max-sm:[&>*:nth-child(n+3)]:hidden",
        )}
      >
        {children ??
          items.map((item, index) => (
            <span key={item} className="inline-flex items-center gap-3">
              {index > 0 ? (
                <span
                  className={cn("size-1 rounded-full", tone === "navy" ? "bg-gold" : "bg-teal")}
                  aria-hidden="true"
                />
              ) : null}
              {item}
            </span>
          ))}
      </div>
    </div>
  );
}
