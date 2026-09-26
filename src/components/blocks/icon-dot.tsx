import { Icon, type IconName } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";

type Props = {
  icon: IconName;
  /** Disc diameter: `sm` 24 px (inline assurances), `md` 28 px (bullets), `lg` 36 px (chips). */
  size?: "sm" | "md" | "lg" | undefined;
  className?: string | undefined;
};

const SIZE = { sm: "size-6", md: "size-7", lg: "size-9" } as const;
const GLYPH = { sm: 14, md: 16, lg: 18 } as const;

/**
 * Round list marker: the icon on a soft `--accent` gradient disc (teal on light, turquoise
 * inside `on-navy`), so it adapts to its surface without props. `check` is drawn as a plain tick
 * (a circled check inside a circle would double the ring). Decorative.
 */
export function IconDot({ icon, size = "md", className }: Props) {
  return (
    <span
      data-slot="icon-dot"
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full bg-linear-135 from-accent/25 to-accent/8 text-accent inset-ring inset-ring-accent/20",
        SIZE[size],
        className,
      )}
    >
      <Icon name={icon === "check" ? "tick" : icon} size={GLYPH[size]} strokeWidth={2.8} />
    </span>
  );
}
