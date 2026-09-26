import type { IconName } from "@/components/blocks/icon";
import { IconDot } from "@/components/blocks/icon-dot";
import { cn } from "@/lib/utils";

type Item = { icon: IconName; text: string };

type Props = {
  items: readonly Item[];
  /** `inline`: one wrapping row (under a CTA); `stack`: one item per line (inside a card). */
  layout?: "inline" | "stack" | undefined;
  tone?: "light" | "dark" | undefined;
  className?: string | undefined;
};

/** Reassurance next to a purchase action: payment, access and guarantee facts on round markers. */
export function AssuranceList({ items, layout = "inline", tone = "light", className }: Props) {
  return (
    <ul
      data-slot="assurance-list"
      className={cn(
        "text-small font-bold text-body",
        layout === "inline" ? "flex flex-wrap gap-x-5 gap-y-2.5" : "grid gap-2.5",
        tone === "dark" && "on-navy",
        className,
      )}
      role="list"
    >
      {items.map((item) => (
        <li key={item.text} className="flex items-start gap-2">
          <IconDot icon={item.icon} size="sm" />
          <span className="pt-[0.1em]">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
