import { cva, type VariantProps } from "class-variance-authority";

/**
 * Badge classes (server-safe, no merge engine). Every badge is a pill.
 * - `chip` follows the semantic roles: mint on light, gold on a translucent white inside `on-navy`.
 * - Tone chips for eyebrows (`turquoise`, `gold-soft`, `sky`): a pale tint of a surface role with
 *   a dark text (teal-text / ink; AA pairs in tests/unit/design-system.test.ts). They read the
 *   roles, so inside `on-navy` they become a translucent tint with white text and a bright dot.
 *   `coral` (rose + coral-hover) labels the offer only and is meant for light surfaces.
 * - `gold`, `navy`, `outline`, `soft`, `glass`: solid labels.
 * `dot: true` prefixes a small colour dot (the eyebrow look).
 * Shared by `Badge`, `Eyebrow` and client code.
 */
export const badgeVariants = cva(
  "inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1.5 rounded-pill px-[0.9em] py-[0.4em] text-tiny font-extrabold tracking-[0.08em] text-balance uppercase [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        chip: "bg-chip text-chip-foreground before:bg-icon",
        turquoise: "bg-accent/14 text-link before:bg-accent",
        coral: "bg-rose text-coral-hover before:bg-coral",
        "gold-soft": "bg-gold/25 text-heading before:bg-(--pv-planet-gold-lo)",
        sky: "bg-foreground/6 text-heading before:bg-ring",
        gold: "bg-gold text-ink before:bg-ink",
        navy: "bg-navy text-gold before:bg-gold",
        outline: "border border-line-strong text-heading before:bg-icon",
        soft: "bg-muted text-heading before:bg-icon",
        glass: "glass text-navy shadow-sm before:bg-teal",
      },
      dot: {
        true: "before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
        false: "",
      },
    },
    defaultVariants: { variant: "chip", dot: false },
  },
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
