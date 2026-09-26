"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import {
  Children,
  createContext,
  isValidElement,
  type KeyboardEvent,
  lazy,
  type MouseEvent,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cx } from "@/lib/cx";

import type { Zoom } from "./ZoomDialog";

const loadZoom = () => import("./ZoomDialog");
const ZoomDialog = lazy(() => loadZoom().then((module) => ({ default: module.ZoomDialog })));

/** Thumbnail and caption of one slide, resolved on the server by `PageGallery`. */
export type SlideMeta = { thumb: string; width: number; height: number; caption: string };

type Props = {
  label: string;
  zoomHint?: string | undefined;
  /** Server-rendered `<GallerySlide>` elements, one per page. */
  children: ReactNode;
  /** Number of slides in `children`; defaults to the child count. */
  count?: number | undefined;
  /** Noun before the counter ("Página real" → "Página real 3 de 20"). */
  itemLabel?: string | undefined;
  /** Visible title of the zoom dialog. */
  zoomTitle?: string | undefined;
  /** Thumbnails and captions (same order as the slides); without it the gallery shows dots. */
  meta?: readonly SlideMeta[] | undefined;
};

/** Product-gallery stage: paper frame on a soft sky ground, the page contained (portrait or landscape). */
const ZOOM =
  "group/zoom relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-white bg-[linear-gradient(160deg,var(--pv-white),var(--pv-celeste))] p-0 [&_img]:aspect-[4/3] [&_img]:w-full [&_img]:object-contain [&_img]:transition-transform [&_img]:duration-500 [&_img]:ease-out motion-safe:hover:[&_img]:scale-[1.025]";
const ARROW =
  "pointer-events-auto grid size-11 cursor-pointer place-items-center rounded-full bg-white/95 text-navy shadow-[0_8px_24px_-6px_oklch(0.3175_0.1094_256.25/40%)] ring-1 ring-navy/10 transition-[scale,background-color] duration-(--duration-fast) ease-out hover:scale-105 hover:bg-white active:scale-95 sm:size-12";
const THUMB =
  "relative shrink-0 cursor-pointer snap-center overflow-hidden rounded-md border-2 border-transparent bg-white p-0 opacity-65 shadow-sm transition-[opacity,border-color,translate] duration-(--duration) ease-out hover:opacity-100 aria-selected:border-navy aria-selected:opacity-100 motion-safe:aria-selected:-translate-y-0.5 [&_img]:block [&_img]:aspect-[4/3] [&_img]:w-16 [&_img]:object-cover cq-sm:[&_img]:w-20";
const DOT =
  "grid h-11 w-6 cursor-pointer place-items-center p-0 before:h-2 before:w-2 before:rounded-full before:bg-line-strong before:transition-[width,background-color] before:duration-(--duration) aria-selected:before:w-5 aria-selected:before:bg-navy";

const preloadZoom = () => void loadZoom();

const ZoomContext = createContext<(image: HTMLImageElement) => void>(() => undefined);

/**
 * Zoom trigger wrapping a slide `<img>`; opens the gallery dialog with that element's
 * current rendition, srcset, alt and caption. Rendered by `GallerySlide` on the server.
 */
export function GalleryZoomButton({ label, children }: { label: string; children: ReactNode }) {
  const open = useContext(ZoomContext);
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    const image = event.currentTarget.querySelector("img");
    if (image) open(image);
  };
  return (
    <button type="button" className={ZOOM} onClick={onClick} onPointerEnter={preloadZoom} aria-label={label}>
      {children}
      <span
        className="absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-white/95 text-navy shadow-[0_8px_24px_-6px_oklch(0.3175_0.1094_256.25/40%)] ring-1 ring-navy/10 transition-transform duration-(--duration-fast) ease-out group-hover/zoom:scale-110"
        aria-hidden="true"
      >
        <Maximize2 size={17} strokeWidth={2.4} />
      </span>
    </button>
  );
}

function zoomFrom(image: HTMLImageElement): Zoom {
  return {
    src: image.currentSrc || image.src,
    srcSet: image.srcset,
    width: Number(image.getAttribute("width")) || image.naturalWidth,
    height: Number(image.getAttribute("height")) || image.naturalHeight,
    alt: image.dataset.alt ?? image.alt,
    caption: image.dataset.caption ?? image.alt,
  };
}

/**
 * Product-page style gallery of real worksheet pages: one large page on a framed stage (drag/swipe,
 * glass arrows, keyboard), a counter pill, the caption, a scroll-snap strip of thumbnails (dots
 * when no thumbnails are given) and a zoom on the Base UI dialog, loaded on first use.
 */
export function GalleryCarousel({ label, zoomHint, children, count, itemLabel, zoomTitle, meta }: Props) {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false,
  });
  const [selected, setSelected] = useState(0);
  const [settled, setSettled] = useState(true);
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  const open = useCallback((image: HTMLImageElement) => {
    setZoom(zoomFrom(image));
    setZoomOpen(true);
  }, []);
  const slides = Children.toArray(children).map((node, index) => ({
    key: String((isValidElement(node) && node.key) || index),
    node,
  }));
  const total = count ?? slides.length;
  const position = (index: number) => `${itemLabel ? `${itemLabel} ` : ""}${index + 1} de ${total}`;
  const thumbs = meta && meta.length === slides.length ? meta : undefined;

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    const onScroll = () => setSettled(false);
    const onSettle = () => setSettled(true);
    onSelect();
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    embla.on("scroll", onScroll);
    embla.on("settle", onSettle);
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
      embla.off("scroll", onScroll);
      embla.off("settle", onSettle);
    };
  }, [embla, onSelect]);

  // Keep the selected thumbnail centred in its strip (horizontal scroll only, never the page).
  useEffect(() => {
    const el = strip.current;
    const thumb = el?.children[selected] as HTMLElement | undefined;
    if (!el || !thumb) return;
    const left = thumb.offsetLeft - (el.clientWidth - thumb.offsetWidth) / 2;
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  }, [selected]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      embla?.scrollNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      embla?.scrollPrev();
    }
  };

  return (
    <ZoomContext.Provider value={open}>
      <section
        data-slot="page-gallery"
        className="cq mx-auto grid w-full max-w-[52rem] gap-4"
        aria-roledescription="carrusel"
        aria-label={label}
      >
        <div className="relative rounded-xl bg-white/70 p-2 shadow-float ring-1 ring-white sm:p-3">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard navigation for the carousel viewport (roving focus lives on the controls) */}
          <div
            className="overflow-hidden rounded-lg"
            ref={emblaRef}
            onKeyDown={onKeyDown}
            data-state={settled ? "settled" : "scrolling"}
          >
            <ul className="-ml-3 flex touch-pan-y touch-pinch-zoom" role="list">
              {slides.map((slide, index) => (
                <li
                  key={slide.key}
                  className="min-w-0 flex-[0_0_100%] pl-3"
                  data-active={index === selected ? "" : undefined}
                  aria-roledescription="diapositiva"
                  aria-label={position(index)}
                >
                  {slide.node}
                </li>
              ))}
            </ul>
          </div>
          <p
            className="pointer-events-none absolute top-5 left-5 rounded-pill bg-navy/88 px-3 py-1.5 text-tiny font-extrabold text-white tabular-nums shadow-md backdrop-blur-md sm:top-6 sm:left-6 sm:text-small"
            aria-live="polite"
          >
            {position(selected)}
          </p>
          <div className="pointer-events-none absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between sm:inset-x-6">
            <button
              type="button"
              className={ARROW}
              onClick={() => embla?.scrollPrev()}
              aria-label="Página anterior"
            >
              <ChevronLeft size={22} strokeWidth={2.6} />
            </button>
            <button
              type="button"
              className={ARROW}
              onClick={() => embla?.scrollNext()}
              aria-label="Página siguiente"
            >
              <ChevronRight size={22} strokeWidth={2.6} />
            </button>
          </div>
        </div>

        {thumbs ? (
          <p className="min-h-[1.5em] text-center text-small font-bold text-ink text-balance">
            {thumbs[selected]?.caption}
          </p>
        ) : null}

        {thumbs ? (
          <div
            ref={strip}
            className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-4 px-1 pt-1 pb-2 [mask-image:linear-gradient(90deg,transparent,#000_1.5rem,#000_calc(100%-1.5rem),transparent)] [scrollbar-width:none] cq-sm:gap-3 [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Ir a una página"
          >
            {slides.map((slide, index) => {
              const item = thumbs[index];
              return (
                <button
                  key={slide.key}
                  type="button"
                  role="tab"
                  aria-selected={index === selected}
                  aria-label={`Ir a la página ${index + 1}`}
                  className={cx(THUMB, index === 0 && "ml-4", index === slides.length - 1 && "mr-4")}
                  onClick={() => embla?.scrollTo(index)}
                >
                  {item ? (
                    <img
                      src={item.thumb}
                      width={item.width}
                      height={item.height}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center" role="tablist" aria-label="Ir a una página">
            {slides.map((slide, index) => (
              <button
                key={slide.key}
                type="button"
                role="tab"
                aria-selected={index === selected}
                aria-label={`Ir a la página ${index + 1}`}
                className={DOT}
                onClick={() => embla?.scrollTo(index)}
              />
            ))}
          </div>
        )}
        {zoomHint ? <p className="text-center text-tiny text-subtle">{zoomHint}</p> : null}
        {zoom ? (
          <Suspense fallback={null}>
            <ZoomDialog open={zoomOpen} zoom={zoom} title={zoomTitle} onClose={() => setZoomOpen(false)} />
          </Suspense>
        ) : null}
      </section>
    </ZoomContext.Provider>
  );
}
