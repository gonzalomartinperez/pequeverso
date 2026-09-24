import { cva, type VariantProps } from "class-variance-authority";

/**
 * Badge classes (server-safe, no merge engine): `chip` (mint on light, gold-on-navy inside
 * `on-navy`), `gold`, `navy`, `outline`, `soft`. Shared by `Badge`, `Eyebrow` and client code.
 */
export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-chip px-[0.7em] py-[0.3em] text-tiny font-extrabold max-w-full tracking-[0.08em] text-balance uppercase [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        chip: "bg-chip text-chip-foreground",
        gold: "bg-gold text-ink",
        navy: "bg-navy text-gold",
        outline: "border border-line-strong text-heading",
        soft: "bg-muted text-heading",
      },
    },
    defaultVariants: { variant: "chip" },
  },
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;
