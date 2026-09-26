"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useAge } from "@/features/landing/AgeSelector/AgeContext";
import { cx } from "@/lib/cx";
import { useMotionOK } from "@/motion/use-motion-ok";

export type GallerySlideItem = {
  /** Stable key (media id of the slide's main image). */
  id: string;
  /** Short description, used in the thumbnail's accessible name. */
  label: string;
  /** Slide content, rendered on the server. */
  node: ReactNode;
  /** Thumbnail image, rendered on the server. */
  thumb: ReactNode;
};

type Props = {
  slides: readonly GallerySlideItem[];
  /** Accessible name of the gallery region. */
  label: string;
  /** Prefix of each thumbnail's accessible name ("Ver imagen"). */
  itemLabel: string;
  prevLabel?: string | undefined;
  nextLabel?: string | undefined;
  /** Classes of the main viewer (card surface: radius, background, shadow). */
  frameClassName?: string | undefined;
  className?: string | undefined;
};

const TRACK =
  "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-ring [&::-webkit-scrollbar]:hidden";
const ARROW =
  "absolute top-1/2 z-40 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/80 text-navy shadow-md backdrop-blur-md transition-[background-color,opacity] duration-(--duration-fast) hover:bg-white disabled:pointer-events-none disabled:opacity-0 @min-[30rem]:grid";

/**
 * Product-page gallery: a scroll-snap track (swipe on touch, arrows and thumbnails from md, dots
 * below) whose first slide is the age-aware composition. Choosing another age brings the first
 * slide back into view, so the featured worksheet swap is always seen. No carousel runtime: the
 * browser scrolls; an IntersectionObserver only tracks the active slide.
 */
export function ProductGallery({
  slides,
  label,
  itemLabel,
  prevLabel = "Imagen anterior",
  nextLabel = "Imagen siguiente",
  frameClassName,
  className,
}: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { ok } = useMotionOK();
  const { selected } = useAge();
  const previousAge = useRef(selected);

  const go = useCallback(
    (index: number) => {
      const el = track.current;
      const target = el?.children[index] as HTMLElement | undefined;
      if (!el || !target) return;
      el.scrollTo({ left: target.offsetLeft, behavior: ok ? "smooth" : "instant" });
      setActive(index);
    },
    [ok],
  );

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index ?? 0));
        }
      },
      { root: el, threshold: 0.6 },
    );
    for (const child of el.children) observer.observe(child);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (previousAge.current === selected) return;
    previousAge.current = selected;
    go(0);
  }, [selected, go]);

  return (
    <section data-slot="product-gallery" className={cx("cq grid gap-3", className)} aria-label={label}>
      <div className={cx("relative overflow-hidden", frameClassName)}>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable (arrow keys scroll it) */}
        <div ref={track} className={TRACK} tabIndex={0}>
          {slides.map((slide, index) => (
            <figure
              key={slide.id}
              data-index={index}
              className="relative m-0 w-full shrink-0 snap-center snap-always"
              aria-label={`${index + 1} / ${slides.length}: ${slide.label}`}
            >
              {slide.node}
            </figure>
          ))}
        </div>
        <button
          type="button"
          className={cx(ARROW, "left-3")}
          onClick={() => go(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label={prevLabel}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          className={cx(ARROW, "right-3")}
          onClick={() => go(Math.min(slides.length - 1, active + 1))}
          disabled={active === slides.length - 1}
          aria-label={nextLabel}
        >
          <ChevronRightIcon aria-hidden="true" className="size-5" strokeWidth={2.4} />
        </button>
      </div>

      <ul
        className="hidden gap-2 @min-[30rem]:grid"
        style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))` }}
        role="list"
      >
        {slides.map((slide, index) => (
          <li key={slide.id} className="min-w-0">
            <button
              type="button"
              onClick={() => go(index)}
              aria-current={active === index ? "true" : undefined}
              aria-label={`${itemLabel} ${index + 1}: ${slide.label}`}
              className={cx(
                "relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-linear-160 from-celeste to-white transition-[border-color,box-shadow,opacity] duration-(--duration-fast) ease-out [&_img]:size-full [&_img]:object-contain [&_picture]:contents",
                active === index
                  ? "border-navy shadow-[0_0_0_3px_oklch(0.3175_0.1094_256.25/14%)]"
                  : "border-white/80 opacity-80 hover:border-line-strong hover:opacity-100",
              )}
            >
              {slide.thumb}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex justify-center gap-1 @min-[30rem]:hidden">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => go(index)}
            aria-current={active === index ? "true" : undefined}
            aria-label={`${itemLabel} ${index + 1}: ${slide.label}`}
            className="grid size-6 place-items-center rounded-full"
          >
            <span
              aria-hidden="true"
              className={cx(
                "block h-2 rounded-full transition-[width,background-color] duration-(--duration) ease-out",
                active === index ? "w-5 bg-navy" : "w-2 bg-navy/25",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
