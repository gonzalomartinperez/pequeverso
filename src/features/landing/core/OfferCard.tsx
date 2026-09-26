import { formatUsd, localCurrencyNote } from "@config/commerce";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { cn } from "@/lib/utils";

type Props = {
  titleId: string;
  kicker: string;
  title: string;
  text: string;
  checks: readonly string[];
  price: { kicker: string; value: number; taxNote: string; guarantee: string };
  cta: ReactNode;
  /** Emphasised line under the title (e.g. "Todo incluido en un único pago de US$14,99."). */
  highlight?: string | undefined;
  /** Reassurance under the card (trust chips). */
  footer?: ReactNode | undefined;
  /** Transparent cut-out of a person pointing toward the price (to their right = image left). */
  pointer?: string | undefined;
  className?: string | undefined;
};

/**
 * The offer as one glowing card: what the single payment includes, and a navy price panel with
 * its tax and currency notes, the CTA and the guarantee. From lg a person stands at the card's
 * right edge pointing at the price.
 */
export function OfferCard({
  titleId,
  kicker,
  title,
  text,
  checks,
  price,
  cta,
  highlight,
  footer,
  pointer,
  className,
}: Props) {
  return (
    <div className={cn("cq relative mx-auto grid max-w-6xl gap-6", className)}>
      <div
        data-slot="offer-card"
        className="border-glow pv-glow-spin relative grid gap-8 rounded-2xl p-5 shadow-float cq-sm:p-8 @min-[64rem]:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] cq-lg:gap-10 cq-lg:p-12 @min-[68rem]:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_14rem]"
        data-reveal=""
      >
        <div className="grid content-center gap-4">
          <Eyebrow>{kicker}</Eyebrow>
          <h2 id={titleId}>{title}</h2>
          {highlight ? (
            <p className="w-fit rounded-md bg-lemon px-4 py-2 font-extrabold text-balance text-ink">
              {highlight}
            </p>
          ) : null}
          <p className="lead text-pretty">{text}</p>
          <ul className="grid gap-3" role="list">
            {checks.map((check) => (
              <li key={check} className="flex items-start gap-3 font-bold text-ink">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-mint text-teal">
                  <Icon name="check" size={16} strokeWidth={2.6} />
                </span>
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="on-navy relative isolate grid content-center gap-2 overflow-hidden rounded-xl bg-linear-170 from-navy to-navy-deep p-6 shadow-lg cq-sm:p-8">
          <div
            aria-hidden="true"
            className="planet-gold absolute -top-16 -right-16 -z-1 size-44 rounded-full opacity-90"
          />
          <p className="text-tiny font-extrabold tracking-[0.1em] text-gold uppercase">{price.kicker}</p>
          <p className="font-display text-[clamp(3rem,2.4rem+2vw,4rem)] leading-none font-bold text-white tabular-nums">
            <span className="sr-only">Precio: </span>
            {formatUsd(price.value)}
          </p>
          <p className="text-small">{price.taxNote}</p>
          <p className="flex items-start gap-2 text-small text-pretty">
            <Icon name="globe" size={16} className="mt-[0.2em] shrink-0 text-turquoise" />
            <span>{localCurrencyNote}</span>
          </p>
          <div className="mt-3 grid [&>*]:w-full">{cta}</div>
          <p className="flex items-center gap-2 text-small font-bold text-turquoise">
            <Icon name="shield" size={18} />
            <span>{price.guarantee}</span>
          </p>
        </div>

        {pointer ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 bottom-0 hidden w-72 @min-[68rem]:block [&_img]:h-auto [&_img]:w-full [&_picture]:contents"
          >
            <MediaImage id={pointer} sizes="288px" alt="" />
          </div>
        ) : null}
      </div>
      {footer}
    </div>
  );
}
