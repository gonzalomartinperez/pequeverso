import { Check, Plus, Sparkles } from "lucide-react";
import type { OfferProduct } from "@/products/schema";
import { AccentText, Kicker } from "./ui";

type Props = { copy: OfferProduct["copy"]["complement"] };

/** "Complementa, no repite": what the buyer already owns next to what this offer adds, joined by a plus orb. */
export function ComplementSection({ copy }: Props) {
  return (
    <section
      data-slot="section"
      data-tone="aurora-cream"
      aria-labelledby="complemento-title"
      className="aurora-cream relative section-pad"
    >
      <div className="page-container grid gap-10 md:gap-14">
        <header className="mx-auto grid max-w-[44rem] justify-items-center gap-4 text-center">
          <Kicker>{copy.kicker}</Kicker>
          <h2 id="complemento-title">
            <AccentText text={copy.title} />
          </h2>
        </header>
        <div className="relative grid items-stretch gap-5 md:grid-cols-2 md:gap-8">
          <article
            data-reveal=""
            className="on-light glass grid content-start gap-4 rounded-2xl p-6 shadow-float sm:p-8"
          >
            <Kicker as="span">{copy.ownedLabel}</Kicker>
            <h3 className="font-display text-[1.5rem] leading-tight font-bold">{copy.owned.title}</h3>
            <ul className="grid gap-3">
              {copy.owned.points.map((point) => (
                <li key={point} className="flex items-center gap-3 font-bold text-body">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint text-teal-text">
                    <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </article>
          <span
            aria-hidden="true"
            className="z-1 mx-auto -my-9 grid size-14 place-items-center rounded-full bg-navy text-gold shadow-float ring-8 ring-white/70 md:absolute md:top-1/2 md:left-1/2 md:my-0 md:-translate-1/2"
          >
            <Plus className="size-7" strokeWidth={2.8} />
          </span>
          <article
            data-reveal=""
            className="on-light relative grid content-start gap-4 overflow-hidden rounded-2xl border border-teal/30 bg-[linear-gradient(160deg,var(--pv-white)_0%,var(--pv-celeste)_100%)] p-6 shadow-float sm:p-8"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-turquoise/30 blur-2xl"
            />
            <Kicker as="span" className="relative bg-white">
              {copy.offerLabel}
            </Kicker>
            <h3 className="relative font-display text-[1.5rem] leading-tight font-bold">
              {copy.offer.title}
            </h3>
            <ul className="relative grid gap-3">
              {copy.offer.points.map((point) => (
                <li key={point} className="flex items-center gap-3 font-bold text-body">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy text-gold">
                    <Sparkles aria-hidden="true" className="size-4" strokeWidth={2.4} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
