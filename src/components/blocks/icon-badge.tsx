import { Icon, type IconName } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";

type Size = 48 | 56 | 72;

type Props = {
  icon: IconName;
  size?: Size;
  tone?: "light" | "dark";
  /** Step number shown in a small gold disc (decorative). */
  number?: number;
  className?: string;
};

const SIZE: Record<Size, string> = {
  48: "size-(--badge-sm)",
  56: "size-(--badge-md)",
  72: "size-(--badge-lg) shadow-md",
};
const ICON_SIZE: Record<Size, number> = { 48: 22, 56: 26, 72: 30 };

/** Circular icon disc (teal on light, gold on navy) with an optional step number. */
export function IconBadge({ icon, size = 56, tone = "light", number, className }: Props) {
  return (
    <span
      data-slot="icon-badge"
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full border-2 border-icon bg-card text-icon shadow-sm",
        SIZE[size],
        tone === "dark" && "on-navy bg-navy-deep shadow-none",
        className,
      )}
    >
      <Icon name={icon} size={ICON_SIZE[size]} strokeWidth={2.2} />
      {number === undefined ? null : (
        <span
          className="absolute -top-1 -right-1 grid h-6 min-w-6 place-items-center rounded-pill bg-gold px-1 text-tiny font-extrabold leading-none text-ink"
          aria-hidden="true"
        >
          {number}
        </span>
      )}
    </span>
  );
}
