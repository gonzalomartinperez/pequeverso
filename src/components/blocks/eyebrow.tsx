import type { ReactNode } from "react";
import { badgeVariants } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";

/** Colour family of the chip; `auto` follows the surface roles (mint on light, gold on navy). */
export type EyebrowAccent = "auto" | "turquoise" | "coral" | "gold" | "sky" | "navy" | "glass";

type Props = {
  tone?: "light" | "dark";
  as?: "p" | "span";
  /** Tone of the chip (default `auto`). `coral` only labels the offer. */
  accent?: EyebrowAccent | undefined;
  /** Leading colour dot (default true). */
  dot?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
};

const VARIANT = {
  auto: "chip",
  turquoise: "turquoise",
  coral: "coral",
  gold: "gold-soft",
  sky: "sky",
  navy: "navy",
  glass: "glass",
} as const;

/** Small uppercase pill with a colour dot above a heading (mint chip on light, gold on navy). */
export function Eyebrow({
  tone = "light",
  as: Tag = "p",
  accent = "auto",
  dot = true,
  className,
  children,
}: Props) {
  return (
    <Tag
      data-slot="eyebrow"
      className={cn(
        badgeVariants({ variant: VARIANT[accent], dot }),
        tone === "dark" && "on-navy",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
