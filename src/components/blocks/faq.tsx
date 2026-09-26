import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Item = { q: string; a: string };

type Props = {
  items: readonly Item[];
  /** Open the first answer by default. */
  openFirst?: boolean;
  /**
   * `card` (separate white cards, default), `glass` (frosted cards over aurora or photos) or
   * `lines` (store product-details accordion: hairline dividers, bold titles, no boxes).
   */
  surface?: "card" | "glass" | "lines" | undefined;
  className?: string;
};

/** The +/− marker: the vertical bar folds into a minus while the marker turns. Decorative. */
function PlusMinus({ boxed }: { boxed: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full transition-[rotate,background-color,color] duration-(--duration) ease-out group-open/faq:rotate-180",
        boxed
          ? "size-9 bg-accent/12 text-secondary group-open/faq:bg-secondary group-open/faq:text-secondary-foreground"
          : "size-7 text-heading",
      )}
    >
      <span className="absolute h-0.5 w-3.5 rounded-full bg-current" />
      <span className="absolute h-3.5 w-0.5 rounded-full bg-current transition-[scale] duration-(--duration) ease-out group-open/faq:scale-y-0" />
    </span>
  );
}

/**
 * FAQ on native `<details>`: no JavaScript, keyboard accessible, several answers may stay open.
 * Card surfaces lift on a floating shadow while open; `lines` stays flat. Height animates
 * through `::details-content` where `interpolate-size` is supported (`pv-details`,
 * motion.css). For interactive accordions use `ui/accordion` (Base UI).
 */
export function FAQ({ items, openFirst = true, surface = "card", className }: Props) {
  const lines = surface === "lines";
  return (
    <div
      data-slot="faq"
      data-surface={surface}
      className={cn(lines ? "grid border-t border-line-strong" : "grid gap-3", className)}
    >
      {items.map((item, index) => (
        <details
          key={item.q}
          className={cn(
            "pv-details group/faq",
            lines
              ? "border-b border-line-strong"
              : cn(
                  "on-light overflow-hidden rounded-lg border shadow-sm transition-[border-color,box-shadow,background-color] duration-(--duration) ease-out open:border-accent/40 open:shadow-float hover:border-accent/30",
                  surface === "glass" ? "glass" : "border-border bg-card",
                ),
          )}
          data-reveal={lines ? undefined : ""}
          style={lines ? undefined : ({ "--i": index % 3 } as CSSProperties)}
          open={openFirst && index === 0}
        >
          <summary
            className={cn(
              "flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-extrabold text-heading focus-visible:-outline-offset-3 [&::-webkit-details-marker]:hidden",
              lines ? "py-4 hover:text-link" : "rounded-lg px-5 py-4 sm:px-6",
            )}
          >
            <span className="text-pretty">{item.q}</span>
            <PlusMinus boxed={!lines} />
          </summary>
          <p className={cn("max-w-[70ch] text-body", lines ? "pr-10 pb-5" : "px-5 pt-0 pb-6 sm:px-6")}>
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
