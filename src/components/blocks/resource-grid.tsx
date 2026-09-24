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

/** The real resources of a product: cover, name, page count and what the file contains. */
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
              className="grid grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow duration-(--duration) ease-out hover:shadow-lg"
              max={4}
            >
              <div className="relative bg-sky [&_img]:aspect-[4/3] [&_img]:w-full [&_img]:object-cover">
                <MediaImage
                  id={resource.card}
                  sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                />
                {badges?.[index] ? (
                  <span
                    className={cn(
                      "absolute top-3 left-3 grid h-8 place-items-center rounded-chip px-3 text-small font-extrabold shadow-sm",
                      badges[index]?.tone === "gold" ? "bg-gold text-ink" : "bg-navy text-gold",
                    )}
                  >
                    {badges[index]?.label}
                  </span>
                ) : (
                  <span
                    className="absolute top-3 left-3 grid h-8 min-w-10 place-items-center rounded-chip bg-navy px-2 text-small font-extrabold text-gold"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
              </div>
              <div className={cn("grid content-start gap-2", compact ? "p-3" : "px-6 pt-4 pb-6")}>
                <p className="text-tiny font-extrabold tracking-[0.06em] text-teal-text uppercase">
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
        <p className="justify-self-center rounded-md bg-lemon px-4 py-3 text-center font-extrabold text-ink">
          {total}
        </p>
      ) : null}
    </div>
  );
}
