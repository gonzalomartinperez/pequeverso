import { formatUsd } from "@config/commerce";
import { cn } from "@/lib/utils";

type Props = {
  price: number;
  /** Previous price in the same funnel (only when it was actually offered before, e.g. downsell). */
  previous?: { label: string; price: number } | undefined;
  /** Compact note next to the price (e.g. "Pago único · impuestos según tu país"). */
  note?: string | undefined;
  /** `md` (text-price) or `lg` (display size, product page hero). */
  size?: "md" | "lg" | undefined;
  tone?: "light" | "dark" | undefined;
  className?: string | undefined;
};

/**
 * Store-style price line: the price in Fraunces with tabular figures and a compact muted note
 * beside it (it wraps under the price on narrow columns). Coral on light, gold on navy. For the full
 * block with tax, currency, CTA and guarantee use `PriceBlock`.
 */
export function PriceTag({ price, previous, note, size = "md", tone = "light", className }: Props) {
  const dark = tone === "dark";
  return (
    <div
      data-slot="price-tag"
      className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", dark && "on-navy", className)}
    >
      <p
        className={cn(
          "font-display leading-none font-bold tracking-[-0.02em] tabular-nums",
          size === "lg" ? "text-[clamp(2.5rem,2rem+2vw,3.5rem)]" : "text-price",
          dark ? "text-gold" : "text-coral",
        )}
      >
        <span className="sr-only">Precio: </span>
        {formatUsd(price)}
      </p>
      {previous ? (
        <p className="text-small font-bold text-muted-foreground tabular-nums">
          <span className="sr-only">{previous.label}: </span>
          <s>{formatUsd(previous.price)}</s>
        </p>
      ) : null}
      {note ? <p className="text-tiny font-bold text-muted-foreground">{note}</p> : null}
    </div>
  );
}
