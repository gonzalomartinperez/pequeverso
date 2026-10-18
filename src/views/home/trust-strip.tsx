import { alimentacionBebe as course } from "@config/affiliates.ts";
import { guaranteeDays } from "@config/commerce.ts";
import { homeCopy as copy } from "@content/es/home";
import { Icon } from "@/shared/editorial/icon.tsx";

const ICON_TILES = [
  "from-mint to-turquoise",
  "from-lemon to-gold",
  "from-sky to-blue-soft",
  "from-rose to-peach",
] as const;

/**
 * Trust strip right under the hero: four purchase facts that hold for both products (Hotmart
 * payment, guarantee, digital access, local currency). The guarantee days are shown only when both
 * products share the same value (config); otherwise the item names the guarantee without a number.
 * Two columns on phones, one glass row from lg. No reveal: it sits at the fold on phones, where a
 * fading tile would be read mid-animation.
 */
export function TrustStrip() {
  const days = guaranteeDays === course.guaranteeDays ? `${guaranteeDays} ` : "";
  return (
    <section aria-label={copy.trust.label} className="cq relative bg-cream pt-2 pb-(--section-pad)">
      <ul className="page-container grid grid-cols-1 gap-3 cq-xs:grid-cols-2 cq-lg:grid-cols-4 cq-lg:gap-0 cq-lg:rounded-xl cq-lg:bg-white cq-lg:p-2 cq-lg:shadow-float cq-lg:ring-1 cq-lg:ring-line">
        {copy.trust.items.map((item, index) => (
          <li
            key={item.icon}
            className="flex flex-col items-start gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-line cq-sm:flex-row cq-sm:gap-4 cq-lg:bg-transparent cq-lg:p-5 cq-lg:shadow-none cq-lg:ring-0 cq-lg:[&+li]:rounded-none cq-lg:[&+li]:border-l cq-lg:[&+li]:border-line"
          >
            <span
              aria-hidden="true"
              className={`grid size-12 shrink-0 place-items-center rounded-md bg-linear-135 ${ICON_TILES[index % ICON_TILES.length]} text-navy`}
            >
              <Icon name={item.icon} size={22} strokeWidth={2.2} />
            </span>
            <span className="grid gap-0.5">
              <span className="leading-snug font-extrabold text-ink first-letter:uppercase">
                {"days" in item ? `${days}${item.title}` : item.title}
              </span>
              <span className="text-small text-body">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
