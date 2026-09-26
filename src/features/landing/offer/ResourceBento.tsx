import type { Resource } from "@content/es/products";
import type { CSSProperties } from "react";
import { MediaImage } from "@/components/blocks/media-image";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/motion/tilt-card";

type Props = {
  resources: readonly Resource[];
  /** Summary line (e.g. "6 PDF · 384 páginas · 9 recursos visibles"). */
  total: string;
};

const COVER =
  "overflow-hidden rounded-lg bg-sky [&_img]:block [&_img]:aspect-[4/3] [&_img]:h-auto [&_img]:w-full [&_img]:object-cover";

/**
 * The pack's nine resources as a bento: the central kit as a navy tile that also carries the three
 * bonuses embedded in it, then one glass tile per themed pack and a summary tile.
 */
export function ResourceBento({ resources, total }: Props) {
  const [lead, ...rest] = resources;
  if (!lead) return null;
  const embedded = rest.filter((resource) => resource.embedded);
  const packs = rest.filter((resource) => !resource.embedded);
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5" role="list">
      <li data-reveal="" className="grid sm:col-span-2 lg:row-span-2">
        <article className="on-navy relative grid content-start gap-5 overflow-hidden rounded-2xl bg-[linear-gradient(160deg,var(--pv-navy),var(--pv-navy-deep))] p-5 shadow-float sm:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-teal/40 blur-3xl"
          />
          <div className="relative flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-gold px-3 py-1 text-tiny font-extrabold tracking-[0.06em] text-ink uppercase">
              {lead.pagesLabel}
            </span>
          </div>
          <div className="relative grid gap-2">
            <h3 className="font-display text-[clamp(1.6rem,1.3rem+1vw,2.1rem)] leading-tight font-bold text-white">
              {lead.title}
            </h3>
            <p className="max-w-[46ch] text-on-navy">{lead.description}</p>
          </div>
          <div
            className={cn(
              COVER,
              "relative mx-auto w-full max-w-[26rem] rotate-[-1.5deg] border-4 border-white/90 shadow-lg",
            )}
          >
            <MediaImage id={lead.card} sizes="(min-width: 1024px) 520px, (min-width: 640px) 80vw, 90vw" />
          </div>
          {embedded.length > 0 ? (
            <ul className="relative grid gap-3" role="list">
              {embedded.map((resource) => (
                <li
                  key={resource.id}
                  className="glass-dark grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3 rounded-lg p-2.5"
                >
                  <span className="overflow-hidden rounded-md [&_img]:block [&_img]:aspect-[4/3] [&_img]:h-auto [&_img]:w-full [&_img]:object-cover">
                    <MediaImage id={resource.card} alt="" sizes="72px" />
                  </span>
                  <span className="grid gap-0.5">
                    <strong className="leading-tight text-white">{resource.title}</strong>
                    <span className="text-tiny font-bold text-gold">{resource.pagesLabel}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </li>
      {packs.map((resource, index) => (
        <li
          key={resource.id}
          data-reveal=""
          style={{ "--i": index % 3 } as CSSProperties}
          className="grid min-w-0"
        >
          <TiltCard
            as="article"
            max={4}
            className="on-light glass grid content-start gap-3 rounded-xl p-3 shadow-[0_18px_40px_-24px_oklch(0.3175_0.1094_256.25/0.45)] transition-shadow duration-(--duration) hover:shadow-float"
          >
            <div className={COVER}>
              <MediaImage
                id={resource.card}
                sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
              />
            </div>
            <div className="grid gap-1.5 px-2 pb-2">
              <p className="text-tiny font-extrabold tracking-[0.06em] text-teal-text uppercase">
                {resource.pagesLabel}
              </p>
              <h3 className="text-[1.1rem] leading-snug font-extrabold">{resource.title}</h3>
              <p className="text-small">{resource.description}</p>
            </div>
          </TiltCard>
        </li>
      ))}
      <li
        data-reveal=""
        className="grid content-center justify-items-start gap-3 rounded-xl border border-dashed border-teal/40 bg-white/60 p-6"
      >
        <p className="font-display text-[1.6rem] leading-tight font-bold text-navy">{total}</p>
      </li>
    </ol>
  );
}
