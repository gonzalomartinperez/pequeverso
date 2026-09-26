import { formatUsd, localCurrencyNote } from "@config/commerce";
import { Globe, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  kicker: string;
  price: number;
  /** Price actually offered in the previous funnel step (downsell only). */
  previous?: { label: string; price: number } | undefined;
  taxNote: string;
  cta: ReactNode;
  hint: string;
  className?: string | undefined;
};

/**
 * Glass price card of the offer heroes: price in coral (the only coral besides the CTA), tax and
 * local-currency notes, the in-page decision link and the Sí/No hint. No invented anchors.
 */
export function OfferPrice({ kicker, price, previous, taxNote, cta, hint, className }: Props) {
  return (
    <div
      data-slot="offer-price"
      className={cn(
        "on-light glass relative grid gap-4 rounded-xl p-5 shadow-float sm:p-6",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(135deg,oklch(1_0_0/0.7),transparent_45%)] after:content-['']",
        className,
      )}
    >
      <div className="relative z-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="grid gap-1">
          <p className="text-tiny font-extrabold tracking-[0.08em] text-teal-text uppercase">{kicker}</p>
          <p className="font-display text-price font-bold text-coral tabular-nums">
            <span className="sr-only">Precio: </span>
            {formatUsd(price)}
          </p>
        </div>
        {previous ? (
          <p className="grid justify-items-start rounded-md sm:justify-items-end bg-white/70 px-3 py-2 text-small text-body">
            <span className="text-tiny font-bold text-subtle">{previous.label}</span>
            <s className="font-bold tabular-nums">{formatUsd(previous.price)}</s>
          </p>
        ) : null}
      </div>
      <div className="relative z-1 grid gap-1.5 text-small text-subtle">
        <p>{taxNote}</p>
        <p className="flex items-start gap-2 text-pretty">
          <Globe aria-hidden="true" className="mt-[0.2em] size-4 shrink-0 text-teal-text" strokeWidth={2.2} />
          <span>{localCurrencyNote}</span>
        </p>
      </div>
      <div className="relative z-1 grid [&>*]:w-full">{cta}</div>
      <p className="relative z-1 flex items-start gap-2 text-small font-bold text-teal-text">
        <ShieldCheck aria-hidden="true" className="mt-[0.1em] size-[18px] shrink-0" strokeWidth={2.2} />
        <span>{hint}</span>
      </p>
    </div>
  );
}
