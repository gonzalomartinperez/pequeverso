import { Icon, type IconName } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";

type Props = {
  items: readonly string[];
  icon?: IconName;
  as?: "ul" | "ol";
  tone?: "light" | "dark";
  className?: string;
};

/** List with an icon bullet (teal on light, gold on navy). */
export function BulletList({ items, icon = "sparkles", as: Tag = "ul", tone = "light", className }: Props) {
  return (
    <Tag
      data-slot="bullet-list"
      className={cn("grid gap-3", tone === "dark" && "on-navy", className)}
      role="list"
    >
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-body">
          <Icon name={icon} size={20} strokeWidth={2.2} className="mt-[0.15em] shrink-0 text-icon" />
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  );
}
