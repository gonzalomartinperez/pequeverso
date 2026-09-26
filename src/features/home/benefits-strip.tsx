import { homeCopy as copy } from "@content/es/home";
import type { CSSProperties } from "react";
import { Icon } from "@/components/blocks/icon";

const ICON_TILES = [
  "from-mint to-turquoise",
  "from-sky to-blue-soft",
  "from-lemon to-gold",
  "from-rose to-peach",
] as const;

/**
 * Storefront benefits bar: four purchase facts with gradient icon tiles, on one glass strip
 * (two columns on phones, four from md). Facts only: delivery, payment, guarantee, printing.
 */
export function BenefitsStrip() {
  return (
    <section aria-label={copy.benefits.label} className="cq relative bg-cream pb-(--section-pad)">
      <ul className="page-container grid grid-cols-2 gap-3 cq-lg:grid-cols-4 cq-lg:gap-0 cq-lg:rounded-xl cq-lg:bg-white cq-lg:p-2 cq-lg:shadow-float cq-lg:ring-1 cq-lg:ring-line">
        {copy.benefits.items.map((item, index) => (
          <li
            key={item.title}
            data-reveal=""
            style={{ "--i": index } as CSSProperties}
            className="flex flex-col items-start gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-line cq-sm:flex-row cq-sm:gap-4 cq-lg:bg-transparent cq-lg:p-5 cq-lg:shadow-none cq-lg:ring-0 cq-lg:[&+li]:border-l cq-lg:[&+li]:border-line cq-lg:[&+li]:rounded-none"
          >
            <span
              aria-hidden="true"
              className={`grid size-12 shrink-0 place-items-center rounded-md bg-linear-135 ${ICON_TILES[index % ICON_TILES.length]} text-navy`}
            >
              <Icon name={item.icon} size={22} strokeWidth={2.2} />
            </span>
            <span className="grid gap-0.5">
              <span className="leading-snug font-extrabold text-ink">{item.title}</span>
              <span className="text-small text-body">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
