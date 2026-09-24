import { ChevronDownIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Item = { q: string; a: string };

type Props = {
  items: readonly Item[];
  /** Open the first answer by default. */
  openFirst?: boolean;
  className?: string;
};

/**
 * FAQ on native `<details>`: no JavaScript, keyboard accessible, several answers may stay open.
 * Height animates through `::details-content` where `interpolate-size` is supported
 * (`pv-details`, motion.css). For interactive accordions use `ui/accordion` (Base UI).
 */
export function FAQ({ items, openFirst = true, className }: Props) {
  return (
    <div data-slot="faq" className={cn("grid gap-3", className)}>
      {items.map((item, index) => (
        <details
          key={item.q}
          className="pv-details group/faq overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-colors duration-(--duration) open:border-teal"
          data-reveal=""
          style={{ "--i": index % 3 } as CSSProperties}
          open={openFirst && index === 0}
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-extrabold text-heading focus-visible:-outline-offset-3 [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-chip text-chip-foreground transition-transform duration-(--duration) ease-out group-open/faq:rotate-180"
            >
              <ChevronDownIcon className="size-4" strokeWidth={2.4} />
            </span>
          </summary>
          <p className="max-w-[70ch] px-6 pt-0 pb-6 text-body">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
