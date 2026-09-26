import { Icon, type IconName } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  icon?: IconName | undefined;
  /**
   * `light` (white card pill, ink text; default), `soft` (teal tint, teal text), `gold` (gold,
   * ink text; a highlight such as "Incluido") or `navy` (navy, white text). `light` and `soft`
   * read the surface roles, so inside `on-navy` they turn navy-deep / turquoise with white text.
   */
  tone?: "light" | "soft" | "gold" | "navy" | undefined;
  as?: "span" | "li" | "p" | undefined;
  className?: string | undefined;
};

const TONE = {
  light: "border border-foreground/10 bg-card/80 text-heading shadow-sm",
  soft: "border border-transparent bg-accent/14 text-link",
  gold: "border border-transparent bg-gold text-ink",
  navy: "border border-transparent bg-navy text-white",
} as const;

/**
 * Store-style product badge: a compact sentence-case pill with an optional icon ("PDF
 * imprimible", "Acceso inmediato", "3–7 años"). Informative only (not a control), so its 28 px
 * height is fine; group several in a `ChipRow` or a `<ul>` with `as="li"`.
 */
export function ProductBadge({ label, icon, tone = "light", as: Tag = "span", className }: Props) {
  return (
    <Tag
      data-slot="product-badge"
      className={cn(
        "inline-flex min-h-7 w-fit max-w-full items-center gap-1.5 rounded-pill px-3 py-1 text-tiny leading-tight font-extrabold",
        TONE[tone],
        className,
      )}
    >
      {icon ? <Icon name={icon} size={14} strokeWidth={2.6} className="shrink-0" /> : null}
      <span>{label}</span>
    </Tag>
  );
}
