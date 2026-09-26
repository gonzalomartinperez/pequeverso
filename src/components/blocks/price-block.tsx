import { formatUsd, guaranteeDays, localCurrencyNote } from "@config/commerce";
import type { ReactNode } from "react";
import { Icon } from "@/components/blocks/icon";
import { IconDot } from "@/components/blocks/icon-dot";
import { cn } from "@/lib/utils";

type Props = {
  kicker: string;
  price: number;
  /** Previous price in the same funnel (only shown when it was actually offered before, e.g. downsell). */
  previous?: { label: string; price: number };
  taxNote: string;
  /** Local-currency explanation under the price; defaults to `localCurrencyNote` (config/commerce). */
  currencyNote?: string;
  cta: ReactNode;
  /** Replaces the default guarantee line ("Pago único · N días de garantía en Hotmart"). */
  ctaNote?: string;
  tone?: "light" | "dark";
  /**
   * Surface: `card` (white, floating shadow; default), `glass` (frosted, over aurora or the
   * sky) or `none` (no frame, when the block sits inside another card such as the offer).
   */
  surface?: "card" | "glass" | "none" | undefined;
  id?: string;
  className?: string;
};

const SURFACE = {
  light: {
    card: "rounded-xl border border-white bg-card p-6 shadow-float sm:p-7",
    glass: "glass rounded-xl p-6 shadow-float sm:p-7",
    none: "",
  },
  dark: {
    card: "glass-dark rounded-xl p-6 sm:p-7",
    glass: "glass-dark rounded-xl p-6 sm:p-7",
    none: "",
  },
} as const;

/** Price, tax and local-currency notes, CTA slot and the guarantee line. No invented anchors. */
export function PriceBlock({
  kicker,
  price,
  previous,
  taxNote,
  currencyNote = localCurrencyNote,
  cta,
  ctaNote,
  tone = "light",
  surface = "card",
  id,
  className,
}: Props) {
  const dark = tone === "dark";
  return (
    <div
      id={id}
      data-slot="price-block"
      className={cn(
        "grid content-start gap-3",
        dark ? "on-navy" : "on-light",
        SURFACE[dark ? "dark" : "light"][surface],
        className,
      )}
    >
      <p
        className={cn(
          "inline-flex items-center gap-2 text-tiny font-extrabold tracking-[0.08em] uppercase before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
          dark ? "text-gold before:bg-gold" : "text-teal-text before:bg-teal",
        )}
      >
        {kicker}
      </p>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <p
          className={cn(
            "font-display text-price font-bold tracking-[-0.02em] tabular-nums",
            dark ? "text-gold" : "text-coral",
          )}
        >
          <span className="sr-only">Precio: </span>
          {formatUsd(price)}
        </p>
        {previous ? (
          <p className="grid pb-1 text-small text-muted-foreground tabular-nums">
            <span className="text-tiny font-bold">{previous.label}</span>
            <s>{formatUsd(previous.price)}</s>
          </p>
        ) : null}
      </div>
      <div className="grid gap-1.5 border-t border-dashed border-border pt-3">
        <p className="text-small text-muted-foreground">{taxNote}</p>
        <p className="flex items-start gap-2 text-small text-pretty text-muted-foreground">
          <Icon
            name="globe"
            size={16}
            className={cn("mt-[0.2em] shrink-0", dark ? "text-turquoise" : "text-teal-text")}
          />
          <span>{currencyNote}</span>
        </p>
      </div>
      <div className="mt-1 grid [&>*]:w-full">{cta}</div>
      <p
        className={cn(
          "flex items-center gap-2 text-small font-bold",
          dark ? "text-white/90" : "text-teal-text",
        )}
      >
        <IconDot icon="shield" size="sm" />
        <span>{ctaNote ?? `Pago único · ${guaranteeDays} días de garantía en Hotmart`}</span>
      </p>
    </div>
  );
}
