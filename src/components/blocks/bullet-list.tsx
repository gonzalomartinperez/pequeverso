import type { IconName } from "@/components/blocks/icon";
import { IconDot } from "@/components/blocks/icon-dot";
import { cn } from "@/lib/utils";

type Props = {
  items: readonly string[];
  icon?: IconName;
  as?: "ul" | "ol";
  tone?: "light" | "dark";
  /** `plain` rows (default) or `card` rows (each item on a soft glass strip). */
  variant?: "plain" | "card" | undefined;
  className?: string;
};

/** List whose bullet is the icon in a round tinted disc (teal on light, turquoise on navy). */
export function BulletList({
  items,
  icon = "sparkles",
  as: Tag = "ul",
  tone = "light",
  variant = "plain",
  className,
}: Props) {
  return (
    <Tag
      data-slot="bullet-list"
      className={cn("grid", variant === "card" ? "gap-2" : "gap-3", tone === "dark" && "on-navy", className)}
      role="list"
    >
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-start gap-3 text-body",
            variant === "card" && "rounded-md border border-foreground/8 bg-card/70 px-4 py-3 shadow-sm",
          )}
        >
          <IconDot icon={icon} className="mt-[-0.05em]" />
          <span className="pt-[0.1em]">{item}</span>
        </li>
      ))}
    </Tag>
  );
}
