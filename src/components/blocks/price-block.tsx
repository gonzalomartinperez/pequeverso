import { formatUsd, guaranteeDays, localCurrencyNote } from "@config/commerce";
import type { ReactNode } from "react";
import { Icon } from "@/components/blocks/icon";
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
  id?: string;
  className?: string;
};

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
  id,
  className,
}: Props) {
  const dark = tone === "dark";
  return (
    <div
      id={id}
      data-slot="price-block"
      className={cn(
        "grid gap-2 rounded-lg border border-border bg-card p-6 shadow-md",
        dark ? "on-navy border-white/16 bg-white/6 shadow-none" : "on-light",
        className,
      )}
    >
      <p
        className={cn(
          "text-tiny font-extrabold tracking-[0.08em] uppercase",
          dark ? "text-gold" : "text-teal-text",
        )}
      >
        {kicker}
      </p>
      <div className="flex flex-wrap items-baseline gap-4">
        <p className={cn("font-display text-price font-bold", dark ? "text-gold" : "text-coral")}>
          <span className="sr-only">Precio: </span>
          {formatUsd(price)}
        </p>
        {previous ? (
          <p className="grid text-small text-muted-foreground">
            <span className="text-tiny font-bold">{previous.label}</span>
            <s>{formatUsd(previous.price)}</s>
          </p>
        ) : null}
      </div>
      <p className="text-small text-muted-foreground">{taxNote}</p>
      <p className="flex items-start gap-2 text-small text-pretty text-muted-foreground">
        <Icon
          name="globe"
          size={16}
          className={cn("mt-[0.2em] shrink-0", dark ? "text-turquoise" : "text-teal-text")}
        />
        <span>{currencyNote}</span>
      </p>
      <div className="mt-2 grid [&>*]:w-full">{cta}</div>
      <p
        className={cn(
          "flex items-center gap-2 text-small font-bold",
          dark ? "text-white/90" : "text-teal-text",
        )}
      >
        <Icon name="shield" size={18} />
        <span>{ctaNote ?? `Pago único · ${guaranteeDays} días de garantía en Hotmart`}</span>
      </p>
    </div>
  );
}
