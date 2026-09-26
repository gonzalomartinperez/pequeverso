import { Icon, type IconName } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";

type Size = 48 | 56 | 72;

/** `auto` tints with the surface `--accent` over `--card` (teal on light, turquoise on navy). */
export type IconBadgeAccent = "auto" | "turquoise" | "gold" | "coral" | "navy";

type Props = {
  icon: IconName;
  size?: Size | undefined;
  tone?: "light" | "dark" | undefined;
  /** Gradient family of the tile (default `auto`). */
  accent?: IconBadgeAccent | undefined;
  /** `square` (rounded tile, default) or `circle`. */
  shape?: "square" | "circle" | undefined;
  /** Step number shown in a small gold disc (decorative). */
  number?: number | undefined;
  className?: string | undefined;
};

const SIZE: Record<Size, string> = {
  48: "size-(--badge-sm) rounded-md",
  56: "size-(--badge-md) rounded-[16px]",
  72: "size-(--badge-lg) rounded-lg",
};
const ICON_SIZE: Record<Size, number> = { 48: 22, 56: 26, 72: 32 };

const ACCENT: Record<IconBadgeAccent, string> = {
  auto: "bg-card bg-linear-145 from-accent/35 to-accent/6 text-accent shadow-sm inset-ring inset-ring-accent/20",
  turquoise: "bg-linear-145 from-turquoise to-mint text-navy shadow-sm inset-ring inset-ring-white/60",
  gold: "bg-linear-145 from-gold to-lemon text-ink shadow-sm inset-ring inset-ring-white/60",
  coral: "bg-linear-145 from-peach to-rose text-coral-hover shadow-sm inset-ring inset-ring-white/60",
  navy: "bg-linear-145 from-navy to-navy-deep text-gold shadow-md inset-ring inset-ring-white/12",
};

/** Icon on a rounded gradient tile (or disc) with an optional step number. */
export function IconBadge({
  icon,
  size = 56,
  tone = "light",
  accent = "auto",
  shape = "square",
  number,
  className,
}: Props) {
  return (
    <span
      data-slot="icon-badge"
      className={cn(
        "relative inline-grid shrink-0 place-items-center",
        SIZE[size],
        shape === "circle" && "rounded-full",
        tone === "dark" && "on-navy",
        ACCENT[accent],
        className,
      )}
    >
      <Icon name={icon} size={ICON_SIZE[size]} strokeWidth={2.2} />
      {number === undefined ? null : (
        <span
          className="absolute -top-2 -right-2 grid h-6 min-w-6 place-items-center rounded-pill bg-gold px-1.5 text-tiny font-extrabold leading-none text-ink ring-3 ring-card"
          aria-hidden="true"
        >
          {number}
        </span>
      )}
    </span>
  );
}
