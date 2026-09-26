import { homeCopy as copy } from "@content/es/home";
import type { CSSProperties } from "react";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { cn } from "@/lib/utils";
import { ageShort, composition } from "./home-data";
import { Accent, Pill, Sparkle } from "./home-ui";

const ICON_TILES = ["from-mint to-turquoise", "from-lemon to-gold", "from-sky to-blue-soft"] as const;
/** Bento placement from lg (6 columns): value, value, photo (two rows) / value, facts. */
const ORDER = ["cq-lg:order-1", "cq-lg:order-2", "cq-md:col-span-2 cq-lg:order-4"] as const;

/**
 * "Qué esperar": three promises the site keeps (real content, short practice, clear purchase)
 * as a bento with gradient icon tiles, and a navy tile with the kit's numbers from the registry.
 */
export function ValuesBento() {
  const v = copy.values;
  const facts = [
    { value: String(composition.pdfCount), label: v.facts.pdf },
    { value: String(composition.pageCount), label: v.facts.pages },
    { value: ageShort, label: v.facts.age },
    { value: "10", label: v.facts.minutes },
  ];
  return (
    <section
      id="valores"
      aria-labelledby="valores-title"
      className="cq relative scroll-mt-(--header-height) bg-[radial-gradient(45%_60%_at_100%_40%,oklch(0.9013_0.0458_264.2/70%),transparent_70%),radial-gradient(40%_50%_at_0%_90%,oklch(0.9483_0.0301_55.6/80%),transparent_70%),var(--pv-cream)] pt-8 pb-[calc(var(--section-pad)+var(--section-overlap))]"
    >
      <div className="page-container">
        <div
          className="mx-auto mb-10 grid max-w-[44rem] justify-items-center gap-3 text-center"
          data-reveal=""
        >
          <Pill>{v.kicker}</Pill>
          <h2 id="valores-title">
            <Accent title={v.title} />
          </h2>
        </div>
        <ul className="grid gap-4 cq-md:grid-cols-2 cq-lg:grid-cols-6 cq-lg:gap-5">
          {v.items.map((item, index) => (
            <li
              key={item.title}
              data-reveal=""
              style={{ "--i": index } as CSSProperties}
              className={cn(
                "group relative grid content-start gap-3 overflow-hidden rounded-xl bg-white p-6 shadow-[0_24px_50px_-32px_oklch(0.3175_0.1094_256.25/55%)] ring-1 ring-line transition-[translate,box-shadow] duration-(--duration) motion-safe:hover:-translate-y-1 hover:shadow-float cq-lg:col-span-2 cq-lg:p-8",
                ORDER[index],
              )}
            >
              <span
                aria-hidden="true"
                className={`grid size-14 place-items-center rounded-lg bg-linear-135 ${ICON_TILES[index % ICON_TILES.length]} text-navy shadow-sm`}
              >
                <Icon name={item.icon} size={26} strokeWidth={2.1} />
              </span>
              <h3 className="mt-2 text-h3 font-extrabold text-ink">{item.title}</h3>
              <p className="max-w-[42ch] text-pretty">{item.text}</p>
              <span
                aria-hidden="true"
                data-n={`0${index + 1}`}
                className="absolute -top-3 right-5 font-display text-[5.5rem] leading-none font-bold text-navy/5 before:content-[attr(data-n)]"
              />
            </li>
          ))}
          <li
            data-reveal=""
            style={{ "--i": 2 } as CSSProperties}
            className="relative min-h-72 overflow-hidden rounded-xl shadow-float cq-md:col-span-2 cq-lg:order-3 cq-lg:col-span-2 cq-lg:row-span-2"
          >
            <figure className="absolute inset-0 [&_img]:size-full [&_img]:object-cover [&_img]:object-[62%_50%]">
              <MediaImage id="gf.life.logro" sizes="(min-width: 1024px) 400px, 92vw" />
              <figcaption className="absolute right-3 bottom-3 rounded-pill bg-white/85 px-3 py-1 text-tiny text-subtle">
                {copy.illustrative}
              </figcaption>
            </figure>
          </li>
          <li
            data-reveal=""
            style={{ "--i": 3 } as CSSProperties}
            className="on-navy relative overflow-hidden rounded-xl p-6 sky-nebula cq-md:col-span-2 cq-lg:order-5 cq-lg:col-span-2 cq-lg:p-8"
          >
            <Sparkle className="absolute top-6 right-7 size-6 text-gold" />
            <h3 className="text-small font-extrabold tracking-[0.08em] text-gold uppercase">
              {v.facts.title}
            </h3>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
              {facts.map((fact) => (
                <div key={fact.label} className="grid gap-1 border-l-2 border-turquoise/40 pl-4">
                  <dt className="order-2 text-small font-semibold text-body">{fact.label}</dt>
                  <dd className="order-1 font-display text-[clamp(2rem,1.6rem+1.4vw,3rem)] leading-none font-bold text-white tabular-nums">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        </ul>
      </div>
    </section>
  );
}
