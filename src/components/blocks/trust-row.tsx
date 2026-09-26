import type { IconName } from "@/components/blocks/icon";
import { IconDot } from "@/components/blocks/icon-dot";
import { cn } from "@/lib/utils";

type Item = { icon: IconName; label: string; detail?: string | undefined };

type Props = {
  items: readonly Item[];
  /**
   * `grid`: 2 columns on phones, one row from `cq-md` (the store trust strip under a buy button);
   * `inline`: a single wrapping line of compact items.
   */
  layout?: "grid" | "inline" | undefined;
  /** Hairline dividers between the cells of the grid layout (default true). */
  divided?: boolean | undefined;
  tone?: "light" | "dark" | undefined;
  className?: string | undefined;
};

/**
 * Compact trust row (payment by Hotmart, instant access, guarantee…): each fact is an icon in a
 * tinted circle with a short bold label and an optional detail. Facts come from config/content;
 * never invent guarantees or claims.
 */
export function TrustRow({ items, layout = "grid", divided = true, tone = "light", className }: Props) {
  const grid = layout === "grid";
  return (
    <div data-slot="trust-row" className={cn("cq", tone === "dark" && "on-navy", className)}>
      <ul
        role="list"
        className={cn(
          grid
            ? cn(
                "grid grid-cols-2 gap-x-4 gap-y-3",
                items.length >= 3 && "cq-md:grid-flow-col cq-md:auto-cols-fr cq-md:grid-cols-none",
                divided && "cq-md:gap-0 cq-md:divide-x cq-md:divide-border",
              )
            : "flex flex-wrap gap-x-5 gap-y-2",
        )}
      >
        {items.map((item) => (
          <li
            key={item.label}
            className={cn(
              "flex min-w-0 items-center gap-2.5",
              grid && divided && "cq-md:justify-center cq-md:px-4",
            )}
          >
            <IconDot icon={item.icon} size={grid ? "lg" : "sm"} />
            <span className="grid min-w-0 leading-tight">
              <span className="text-small font-extrabold text-heading">{item.label}</span>
              {item.detail ? <span className="text-tiny text-muted-foreground">{item.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
