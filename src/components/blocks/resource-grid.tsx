import type { Resource } from "@content/es/products";
import type { CSSProperties } from "react";
import { MediaImage } from "@/components/blocks/media-image";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/motion/tilt-card";

type Badge = { label: string; tone?: "navy" | "gold" | undefined };

type Props = {
  resources: Resource[];
  compact?: boolean | undefined;
  total?: string | undefined;
  /** One label per resource replacing the running number (e.g. "Material principal", "Bono 1 · incluido"). */
  badges?: readonly Badge[] | undefined;
  className?: string | undefined;
};

/** The real resources of a product: cover tiles (hover lift + image zoom), name, page count and contents. */
export function ResourceGrid({ resources, compact = false, total, badges, className }: Props) {
  return (
    <div data-slot="resource-grid" className={cn("cq grid gap-6", className)}>
      <ol
        className={cn(
          "grid cq-lg:grid-cols-3",
          compact ? "grid-cols-2 gap-3 cq-sm:gap-6" : "grid-cols-1 gap-6 cq-sm:grid-cols-2",
        )}
        role="list"
      >
        {resources.map((resource, index) => (
          <li
            key={resource.id}
            className="grid min-w-0"
            data-reveal=""
            style={{ "--i": index % 3 } as CSSProperties}
          >
            <TiltCard
              as="article"
              className="group/resource grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-white bg-card shadow-sm transition-[transform,translate,box-shadow] duration-(--duration) ease-out hover:shadow-float motion-safe:hover:-translate-y-1"
              max={4}
            >
              <div className="relative overflow-hidden bg-linear-160 from-celeste to-sky [&_img]:aspect-[4/3] [&_img]:w-full [&_img]:object-cover [&_img]:transition-[scale] [&_img]:duration-(--duration-reveal) [&_img]:ease-out motion-safe:group-hover/resource:[&_img]:scale-[1.04]">
                <MediaImage
                  id={resource.card}
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                />
                {badges?.[index] ? (
                  <span
                    className={cn(
                      "absolute top-3 left-3 grid min-h-8 place-items-center rounded-pill px-3 text-tiny font-extrabold tracking-[0.02em] shadow-md",
                      badges[index]?.tone === "gold" ? "bg-gold text-ink" : "bg-navy text-gold",
                    )}
                  >
                    {badges[index]?.label}
                  </span>
                ) : (
                  <span
                    className="absolute top-3 left-3 grid h-8 min-w-11 place-items-center rounded-pill bg-navy px-2.5 text-small font-extrabold text-gold tabular-nums shadow-md"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
              </div>
              <div className={cn("grid content-start gap-2", compact ? "p-3 cq-sm:p-4" : "px-6 pt-5 pb-6")}>
                <p className="inline-flex items-center gap-1.5 text-tiny font-extrabold tracking-[0.06em] text-teal-text uppercase before:size-1.5 before:rounded-full before:bg-teal before:content-['']">
                  {resource.pagesLabel}
                </p>
                <h3 className={cn("font-extrabold", compact ? "text-base" : "text-[1.2rem]")}>
                  {resource.title}
                </h3>
                {!compact ? <p className="text-small">{resource.description}</p> : null}
              </div>
            </TiltCard>
          </li>
        ))}
      </ol>
      {total ? (
        <p className="justify-self-center rounded-pill border border-white bg-linear-135 from-lemon to-peach px-6 py-3 text-center font-extrabold text-ink shadow-md">
          {total}
        </p>
      ) : null}
    </div>
  );
}
