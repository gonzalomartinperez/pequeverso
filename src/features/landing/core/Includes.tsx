import type { Resource } from "@content/es/products";
import type { CSSProperties, ReactNode } from "react";
import { Eyebrow } from "@/components/blocks/eyebrow";
import { MediaImage } from "@/components/blocks/media-image";
import { Counter } from "@/motion/counter";
import { TiltCard } from "@/motion/tilt-card";
import { Accent } from "./parts";

type Props = {
  titleId: string;
  kicker: string;
  title: string;
  titleAccent?: string | undefined;
  lead?: string | undefined;
  counts: { pdf: number; pages: number };
  units: { pdf: string; pages: string };
  resources: readonly Resource[];
  /** Labels built by the page from the copy ("Material principal", "Bono", "incluido"). */
  labels: { main: string; bonus: string; included: string };
  /** The whole-kit tile: title, text and the kit visual (`gf.cutout.kit`). */
  kit: { title: string; text: string; image: string };
  /** The all-included price tile (price formatted from the registry). */
  price: { kicker: string; value: string; note: string; link: string; href: string };
  /** Optional lifestyle photo tile (slot for the kit in use). */
  photo?: ReactNode | undefined;
};

const COVER_SIZES = "(min-width: 1024px) 280px, (min-width: 640px) 45vw, 46vw";

/**
 * "Todo lo que incluye" as a bento: a large navy tile for the main PDF, glass tiles with the
 * cover of every bonus, the whole-kit tile and the coral all-included price tile. Counts and
 * price come from the registry; the grid follows its own width (2 → 4 columns).
 */
export function Includes({
  titleId,
  kicker,
  title,
  titleAccent,
  lead,
  counts,
  units,
  resources,
  labels,
  kit,
  price,
  photo,
}: Props) {
  const [main, ...bonuses] = resources;
  return (
    <div data-slot="includes" className="cq grid gap-10">
      <div className="grid items-end gap-6 cq-lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid max-w-[62ch] gap-4" data-reveal="blur">
          <Eyebrow>{kicker}</Eyebrow>
          <h2 id={titleId}>
            <Accent text={title} accent={titleAccent} />
          </h2>
          {lead ? <p className="lead text-pretty">{lead}</p> : null}
        </div>
        <dl className="flex gap-3" data-reveal="">
          {[
            { value: counts.pdf, unit: units.pdf },
            { value: counts.pages, unit: units.pages },
          ].map((count) => (
            <div
              key={count.unit}
              className="glass grid min-w-28 flex-1 justify-items-center rounded-xl px-6 py-4 text-center shadow-float"
            >
              <dt className="order-2 text-small font-extrabold text-body">{count.unit}</dt>
              <dd className="order-1 m-0 font-display text-[clamp(2.25rem,1.8rem+1.6vw,3rem)] leading-none font-bold text-navy tabular-nums">
                <Counter value={count.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <ul className="grid grid-cols-2 gap-3 cq-sm:gap-4 cq-lg:grid-cols-4 cq-lg:gap-5" role="list">
        {main ? (
          <li
            className="on-navy relative col-span-2 grid min-h-80 overflow-hidden rounded-2xl bg-linear-160 from-navy to-navy-deep p-6 shadow-float cq-sm:p-8 cq-lg:row-span-2"
            data-reveal=""
          >
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-20 size-72 rounded-full bg-[radial-gradient(closest-side,oklch(0.5324_0.0917_190.84/55%),transparent)]"
            />
            <div className="relative grid max-w-[34ch] content-start gap-3">
              <span className="w-fit rounded-pill bg-gold px-3 py-1 text-tiny font-extrabold tracking-[0.08em] text-ink uppercase">
                {labels.main}
              </span>
              <h3 className="font-display text-[clamp(1.6rem,1.3rem+1.2vw,2.25rem)] leading-tight font-bold text-white">
                {main.title}
              </h3>
              <p className="text-pretty">{main.description}</p>
              <p className="font-extrabold text-turquoise">{main.pagesLabel}</p>
            </div>
            <div className="relative mt-6 -mr-10 -mb-12 w-[88%] justify-self-end overflow-hidden rounded-xl border-4 border-white/90 shadow-2xl rotate-[-4deg] cq-lg:w-[78%] [&_img]:aspect-[4/3] [&_img]:h-auto [&_img]:w-full [&_img]:object-cover [&_picture]:contents">
              <MediaImage id={main.card} sizes="(min-width: 1024px) 460px, 80vw" />
            </div>
          </li>
        ) : null}

        {bonuses.map((resource, index) => (
          <li
            key={resource.id}
            className="min-w-0"
            data-reveal=""
            style={{ "--i": index % 4 } as CSSProperties}
          >
            <TiltCard
              as="article"
              max={4}
              className="glass cq grid h-full content-start gap-2 rounded-xl p-2.5 shadow-float cq-sm:p-3"
            >
              <div className="relative overflow-hidden rounded-lg bg-sky [&_img]:aspect-[4/3] [&_img]:w-full [&_img]:object-cover [&_picture]:contents">
                <MediaImage id={resource.card} sizes={COVER_SIZES} />
                <span className="absolute top-2 left-2 rounded-pill bg-navy px-2.5 py-1 text-tiny font-extrabold text-gold shadow-sm">
                  {labels.bonus} {index + 1}
                </span>
              </div>
              <div className="grid gap-1 px-1 pb-1">
                <h3 className="text-[0.9375rem] leading-snug font-extrabold text-ink cq-sm:text-base">
                  {resource.title}
                </h3>
                <p className="hidden text-small text-pretty text-body @min-[15rem]:block">
                  {resource.description}
                </p>
                <p className="text-tiny font-extrabold text-teal-text">
                  {resource.pagesLabel} · {labels.included}
                </p>
              </div>
            </TiltCard>
          </li>
        ))}

        <li
          className="relative col-span-2 grid min-h-56 items-center gap-4 overflow-hidden rounded-2xl bg-linear-100 from-lemon to-peach p-6 shadow-float cq-sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] cq-sm:p-8 cq-lg:col-span-3"
          data-reveal=""
        >
          <div className="relative z-1 grid gap-2">
            <h3 className="font-display text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-tight font-bold text-ink">
              {kit.title}
            </h3>
            <p className="text-pretty text-body">{kit.text}</p>
            <p className="font-extrabold text-navy">
              {counts.pdf} {units.pdf} · {counts.pages} {units.pages}
            </p>
          </div>
          <div className="-my-4 [&_img]:h-auto [&_img]:w-full [&_picture]:contents">
            <MediaImage id={kit.image} sizes="(min-width: 1024px) 460px, 90vw" alt="" />
          </div>
        </li>

        <li
          className="relative col-span-2 grid content-center gap-1 overflow-hidden rounded-2xl bg-linear-160 from-coral to-coral-hover p-6 text-white shadow-cta cq-sm:p-8 cq-lg:col-span-1"
          data-reveal=""
        >
          <div
            aria-hidden="true"
            className="absolute -right-10 -bottom-10 size-40 rounded-full bg-white/10"
          />
          <p className="text-tiny font-extrabold tracking-[0.1em] text-white uppercase">{price.kicker}</p>
          <p className="font-display text-[clamp(2.25rem,1.9rem+1.2vw,2.75rem)] leading-none font-bold text-white tabular-nums">
            {price.value}
          </p>
          <p className="font-bold text-white/90">{price.note}</p>
          <a
            href={price.href}
            className="mt-2 inline-flex min-h-11 w-fit items-center font-extrabold text-white underline decoration-2 underline-offset-4 hover:text-white hover:decoration-gold focus-visible:outline-white"
          >
            {price.link}
          </a>
        </li>

        {photo ? <li className="col-span-2 cq-lg:col-span-4">{photo}</li> : null}
      </ul>
    </div>
  );
}
