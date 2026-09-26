import { localCurrencyNote } from "@config/commerce";
import { homeCopy as copy } from "@content/es/home";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { Float } from "@/motion/float";
import { bonuses, composition, price } from "./home-data";
import { Accent, LINK_NAVY, Pill, ProductLink, Sparkle } from "./home-ui";

const KIT_SIZES = "(min-width: 1280px) 620px, (min-width: 1024px) 50vw, 92vw";

/**
 * "Empieza por aquí" as a storefront product card: the whole kit (cut-out) on a sky gradient
 * stage with its format badges, and beside it the vendor, name, promise, what the bundle holds,
 * the registry price and the navy "Ver producto" link (`start`), with the purchase facts under it.
 */
export function FeaturedProduct() {
  const f = copy.featured;
  const badges = [
    `${composition.pdfCount} ${f.units.pdf}`,
    `${composition.pageCount} ${f.units.pages}`,
    composition.ageRange,
  ];
  return (
    <section
      id="empieza"
      aria-labelledby="empieza-title"
      className="cq relative scroll-mt-(--header-height) bg-cream pt-6 pb-(--section-pad)"
    >
      <div className="page-container">
        <div className="mb-10 grid justify-items-center gap-3 text-center" data-reveal="">
          <Pill>{f.kicker}</Pill>
          <h2 id="empieza-title">
            <Accent title={f.title} />
          </h2>
          <p className="lead max-w-[52ch] text-pretty">{f.lead}</p>
        </div>

        <article
          aria-labelledby="featured-name"
          className="grid overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-line cq-lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]"
          data-reveal="blur"
        >
          {/* Stage */}
          <div className="relative isolate grid min-h-72 place-items-center overflow-hidden bg-[radial-gradient(60%_60%_at_78%_18%,oklch(0.8521_0.0956_187.2/40%),transparent_70%),radial-gradient(55%_55%_at_12%_92%,oklch(0.9483_0.0301_55.6/95%),transparent_70%),linear-gradient(160deg,var(--pv-celeste),var(--pv-white)_70%)] px-4 pt-16 pb-8 cq-sm:px-10 cq-lg:py-14">
            <ul className="absolute top-4 left-4 z-1 flex flex-wrap gap-2 cq-sm:top-6 cq-sm:left-6">
              {badges.map((badge) => (
                <li
                  key={badge}
                  className="rounded-pill bg-white/90 px-3 py-1 text-tiny font-extrabold text-navy shadow-sm ring-1 ring-white"
                >
                  {badge}
                </li>
              ))}
            </ul>
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -z-1 aspect-square w-[78%] -translate-1/2 rounded-full border-2 border-dashed border-teal/25"
            />
            <Sparkle className="absolute top-[22%] right-[10%] size-6 text-gold" />
            <Sparkle className="absolute bottom-[16%] left-[8%] size-4 text-teal" />
            <Float range={10} className="w-full max-w-[40rem]">
              <MediaImage
                id="gf.cutout.kit"
                sizes={KIT_SIZES}
                className="h-auto w-full drop-shadow-[0_30px_40px_oklch(0.3175_0.1094_256.25/28%)]"
              />
            </Float>
          </div>

          {/* Details */}
          <div className="grid content-center gap-5 p-6 cq-sm:p-10 cq-lg:p-12">
            <div className="grid gap-2">
              <p className="text-tiny font-extrabold tracking-[0.1em] text-subtle uppercase">{f.vendor}</p>
              <h3
                id="featured-name"
                className="font-display text-[clamp(2rem,1.5rem+1.6vw,2.75rem)] leading-tight"
              >
                {f.name}
              </h3>
              <p className="text-pretty">{f.promise}</p>
            </div>
            <ul className="grid gap-2 rounded-lg bg-sky/70 p-4 text-small font-bold text-ink">
              <li className="flex items-center gap-2.5">
                <Icon name="book" size={18} className="shrink-0 text-teal" />
                {f.bundle.main}
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="sparkles" size={18} className="shrink-0 text-teal" />
                {bonuses.length} {f.bundle.bonuses}
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="download" size={18} className="shrink-0 text-teal" />
                {f.digital}
              </li>
            </ul>
            <div className="grid gap-1 border-t border-line pt-5">
              <p className="text-tiny font-extrabold tracking-[0.06em] text-subtle uppercase">
                {f.priceKicker}
              </p>
              <p className="font-display text-price font-bold text-navy tabular-nums">{price}</p>
              <p className="flex items-start gap-2 text-small text-pretty text-subtle">
                <Icon name="globe" size={16} className="mt-[0.2em] shrink-0 text-teal-text" />
                <span>{localCurrencyNote}</span>
              </p>
            </div>
            <ProductLink position="start" className={`${LINK_NAVY} w-full`}>
              {f.cta}
            </ProductLink>
            <ul className="grid gap-2 text-small font-semibold text-body cq-sm:grid-cols-3 cq-sm:gap-3 cq-lg:grid-cols-1">
              {f.assurance.map((item) => (
                <li key={item.text} className="flex items-center gap-2">
                  <Icon name={item.icon} size={16} className="shrink-0 text-teal" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}
