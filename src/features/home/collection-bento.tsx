import { homeCopy as copy } from "@content/es/home";
import type { CSSProperties } from "react";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { Section } from "@/components/blocks/section";
import { cn } from "@/lib/utils";
import { bonuses, mainResource, product } from "./home-data";
import { Accent, Pill } from "./home-ui";

const MAIN_SIZES = "(min-width: 1024px) 560px, 92vw";
const BONUS_SIZES = "(min-width: 1024px) 270px, 46vw";
const TILE =
  "group relative grid content-start gap-3 rounded-lg bg-white p-2 cq-sm:gap-4 cq-sm:rounded-xl cq-sm:p-3 shadow-[0_18px_40px_-28px_oklch(0.3175_0.1094_256.25/55%)] ring-1 ring-line transition-[translate,box-shadow] duration-(--duration) ease-out motion-safe:hover:-translate-y-1 hover:shadow-float";
const COVER =
  "overflow-hidden rounded-lg bg-cream [&_img]:h-auto [&_img]:w-full [&_img]:transition-transform [&_img]:duration-500 [&_img]:ease-out motion-safe:group-hover:[&_img]:scale-[1.04]";

/**
 * The collection inside the kit, shop-grid style: the main PDF as the large tile (cover,
 * contents, page count) and each bonus as a product tile (cover, title, pages, "Incluido").
 */
export function CollectionBento() {
  const main = mainResource;
  return (
    <Section
      id="incluye"
      labelledBy="incluye-title"
      className="cq bg-[radial-gradient(40%_35%_at_95%_20%,oklch(0.8521_0.0956_187.2/28%),transparent_70%),radial-gradient(45%_40%_at_0%_70%,oklch(0.9013_0.0458_264.2/60%),transparent_70%),linear-gradient(180deg,var(--pv-cream)_0%,var(--pv-celeste)_40%,var(--pv-celeste)_65%,var(--pv-cream)_100%)]"
    >
      <div className="mb-10 grid gap-3 cq-lg:grid-cols-[minmax(0,1fr)_auto] cq-lg:items-end">
        <div className="grid max-w-[46rem] justify-items-start gap-3" data-reveal="">
          <Pill>{copy.collection.kicker}</Pill>
          <h2 id="incluye-title">
            <Accent title={copy.collection.title} />
          </h2>
          <p className="lead text-pretty">{copy.collection.lead}</p>
        </div>
        <p
          className="w-fit rounded-pill bg-white px-4 py-2 text-small font-extrabold text-navy shadow-sm ring-1 ring-line"
          data-reveal=""
        >
          {product.composition.pdfCount} {copy.featured.units.pdf} · {product.composition.pageCount}{" "}
          {copy.featured.units.pages}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 cq-sm:gap-4 cq-lg:grid-cols-4 cq-lg:gap-5">
        {main ? (
          <li
            className={cn(
              TILE,
              "col-span-2 gap-5 bg-linear-160 from-white to-sky p-4 cq-lg:row-span-2 cq-lg:p-6",
            )}
            data-reveal=""
          >
            <div className={COVER}>
              <MediaImage id={main.card} sizes={MAIN_SIZES} />
            </div>
            <div className="grid gap-3 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-pill bg-lemon px-3 py-1 text-tiny font-extrabold tracking-[0.06em] text-ink uppercase">
                  {copy.collection.principal.label}
                </span>
                <span className="text-small font-bold text-subtle">{main.pagesLabel}</span>
              </div>
              <h3 className="font-display text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-tight">
                {main.title}
              </h3>
              <p className="text-pretty">{main.description}</p>
              <ul className="grid gap-1.5">
                {copy.collection.principal.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 font-semibold text-ink">
                    <Icon name="check" size={18} className="mt-[0.2em] shrink-0 text-teal" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ) : null}
        {bonuses.map((bonus, index) => (
          <li
            key={bonus.id}
            className={TILE}
            data-reveal=""
            style={{ "--i": (index % 4) + 1 } as CSSProperties}
          >
            <div className={COVER}>
              <MediaImage id={bonus.card} sizes={BONUS_SIZES} />
            </div>
            <div className="grid gap-1.5 px-0.5 pb-1 cq-sm:px-1">
              <h3 className="text-small leading-snug font-extrabold text-ink cq-sm:text-base">
                {bonus.title}
              </h3>
              <p className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-tiny cq-sm:text-small">
                <span className="font-semibold text-subtle">{bonus.pagesLabel}</span>
                <span className="inline-flex items-center gap-1 rounded-pill bg-mint px-2.5 py-0.5 text-tiny font-extrabold text-teal-text">
                  <Icon name="check" size={13} strokeWidth={2.6} />
                  {copy.collection.included}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
