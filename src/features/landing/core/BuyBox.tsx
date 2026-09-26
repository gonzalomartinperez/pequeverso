import { formatUsd, localCurrencyNote } from "@config/commerce";
import { ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/blocks/icon";
import { cn } from "@/lib/utils";
import { Accent } from "./parts";

type Detail = { title: string; body: ReactNode };

type Props = {
  id: string;
  titleId: string;
  kicker: string;
  title: string;
  tagline: string;
  taglineAccent?: string | undefined;
  lead: string;
  badges: readonly { icon: IconName; text: string }[];
  price: number;
  priceTag: string;
  taxNote: string;
  /** The age variant selector (client island). */
  variant?: ReactNode | undefined;
  /** The purchase CTA (`CheckoutLink`, position `hero`). */
  cta: ReactNode;
  /** Payment, access and guarantee facts under the CTA. */
  trust: readonly { icon: IconName; text: string }[];
  secondary?: { label: string; href: string } | undefined;
  details: readonly Detail[];
  className?: string | undefined;
};

/**
 * The product page "buy box": name, promise, fact badges, price with its tax and currency
 * notes, the age variant, the full-width coral CTA, trust icons and detail accordions (native
 * `<details>`, no JavaScript). Carries `#comprar`, the target of the checkout fallback.
 */
export function BuyBox({
  id,
  titleId,
  kicker,
  title,
  tagline,
  taglineAccent,
  lead,
  badges,
  price,
  priceTag,
  taxNote,
  variant,
  cta,
  trust,
  secondary,
  details,
  className,
}: Props) {
  return (
    <div
      id={id}
      data-slot="buy-box"
      className={cn(
        "on-light cq grid scroll-mt-(--header-height) gap-5 rounded-2xl border border-white bg-white/94 p-5 shadow-float cq-sm:p-8",
        className,
      )}
    >
      <div className="grid gap-3">
        <p className="text-tiny font-extrabold tracking-[0.12em] text-teal-text uppercase">{kicker}</p>
        <h1 id={titleId} className="text-[clamp(2rem,1.55rem+1.6vw,3rem)] leading-[1.04]">
          {title}
        </h1>
        <p className="font-display text-[clamp(1.25rem,1.1rem+0.6vw,1.6rem)] leading-snug font-semibold text-balance text-ink">
          <Accent text={tagline} accent={taglineAccent} />
        </p>
        <ul className="mt-1 flex flex-wrap gap-2" role="list">
          {badges.map((badge) => (
            <li
              key={badge.text}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-teal/20 bg-mint px-3 text-small font-extrabold text-navy"
            >
              <Icon name={badge.icon} size={16} strokeWidth={2.4} className="text-teal" />
              {badge.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-1.5 border-y border-border py-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-display text-[clamp(2.5rem,2.1rem+1.4vw,3.25rem)] leading-none font-bold text-coral tabular-nums">
            <span className="sr-only">Precio: </span>
            {formatUsd(price)}
          </p>
          <span className="rounded-pill bg-rose px-3 py-1 text-small font-extrabold text-coral-hover">
            {priceTag}
          </span>
        </div>
        <p className="text-small text-muted-foreground">{taxNote}</p>
        <p className="flex items-start gap-2 text-small text-pretty text-muted-foreground">
          <Icon name="globe" size={16} className="mt-[0.2em] shrink-0 text-teal-text" />
          <span>{localCurrencyNote}</span>
        </p>
      </div>

      {variant}

      <div className="grid gap-4">
        {cta}
        <ul className="grid grid-cols-3 gap-2 text-center" role="list">
          {trust.map((item) => (
            <li
              key={item.text}
              className="grid justify-items-center gap-1.5 text-tiny leading-snug font-bold text-body"
            >
              <span className="grid size-10 place-items-center rounded-full bg-sky text-navy">
                <Icon name={item.icon} size={20} strokeWidth={2.2} />
              </span>
              {item.text}
            </li>
          ))}
        </ul>
        <p className="text-pretty text-body">{lead}</p>
        {secondary ? (
          <a
            href={secondary.href}
            className="inline-flex min-h-11 items-center justify-center gap-1 justify-self-center text-small font-extrabold text-link underline-offset-4 hover:underline"
          >
            {secondary.label}
            <ChevronDownIcon aria-hidden="true" className="size-4" strokeWidth={2.6} />
          </a>
        ) : null}
      </div>

      <div className="grid border-t border-border">
        {details.map((detail) => (
          <details key={detail.title} className="pv-details group/detail border-b border-border">
            <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-4 py-3 font-extrabold text-heading focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
              <span>{detail.title}</span>
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-sky text-navy transition-transform duration-(--duration) ease-out group-open/detail:rotate-180"
              >
                <ChevronDownIcon className="size-4" strokeWidth={2.6} />
              </span>
            </summary>
            <div className="pb-5 text-small text-pretty text-body">{detail.body}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
