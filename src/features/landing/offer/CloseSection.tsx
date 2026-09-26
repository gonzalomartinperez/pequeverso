import { DecisionLink } from "@/features/commerce/DecisionLink/DecisionLink";
import type { OfferProduct } from "@/products/schema";
import { AccentText, Kicker, Sparkle, StarField } from "./ui";

type Props = { copy: OfferProduct["copy"]["close"] };

/**
 * Closing navy band with a soft arc edge: both answers are fine; the CTA only scrolls to the widget.
 * The sky, the stars and the two planets are static CSS (no scene on post-purchase pages).
 */
export function CloseSection({ copy }: Props) {
  return (
    <section
      id="cierre"
      data-slot="section"
      data-tone="navy"
      aria-labelledby="cierre-title"
      className="on-navy sky-nebula arc-top relative z-1 -mt-(--section-overlap) overflow-clip section-pad"
    >
      <StarField />
      <div
        aria-hidden="true"
        className="planet-teal pointer-events-none absolute -top-24 -right-24 size-[clamp(180px,24vw,340px)] rounded-full opacity-70"
      />
      <div
        aria-hidden="true"
        className="planet-gold pointer-events-none absolute bottom-[12%] left-[7%] size-[clamp(48px,6vw,88px)] rounded-full opacity-85"
      />
      <Sparkle className="top-[18%] left-[16%]" size={26} />
      <div className="page-container relative">
        <div className="glass-dark mx-auto grid max-w-[46rem] justify-items-center gap-5 rounded-2xl px-6 py-10 text-center sm:px-12 sm:py-14">
          <Kicker tone="dark">{copy.kicker}</Kicker>
          <h2 id="cierre-title" className="text-balance">
            <AccentText text={copy.title} tone="dark" />
          </h2>
          <p className="lead max-w-[52ch] text-pretty">{copy.text}</p>
          <DecisionLink variant="inverse" className="mt-2 rounded-pill">
            {copy.cta}
          </DecisionLink>
        </div>
      </div>
    </section>
  );
}
