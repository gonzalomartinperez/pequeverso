"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
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
  useState,
} from "react";
import { buttonVariants } from "@/components/ui/button-variants";

import type { Zoom } from "./ZoomDialog";

const loadZoom = () => import("./ZoomDialog");
const ZoomDialog = lazy(() => loadZoom().then((module) => ({ default: module.ZoomDialog })));

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
};

const ZOOM =
  "relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-white p-0 opacity-60 shadow-md transition-opacity duration-(--duration) ease-out group-data-active/slide:opacity-100 [&_img]:aspect-[4/3] [&_img]:w-full [&_img]:object-cover";
/** Inactive slides recede in depth (not under reduced motion); only the image dims, never the caption. */
const SLIDE =
  "group/slide grid min-w-0 flex-[0_0_min(640px,88%)] gap-2 pl-4 transition-[scale,translate] duration-(--duration) ease-out motion-safe:not-data-active:scale-92 motion-safe:not-data-active:-translate-z-10";
const ARROW = buttonVariants({ variant: "outline", size: "icon" });
const DOT =
  "grid h-11 w-7 place-items-center p-0 before:size-2.5 before:rounded-full before:bg-line-strong before:transition-transform before:duration-(--duration-fast) aria-selected:before:scale-130 aria-selected:before:bg-navy";

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
        className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-navy text-white shadow-sm"
        aria-hidden="true"
      >
        <ZoomIn size={18} />
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
 * Accessible carousel of real worksheet pages: drag/swipe, arrows, dots, keyboard,
 * live counter, and a zoom on the Base UI dialog (loaded on first use). Slides use a light 3D depth effect
 * (inactive slides recede) that is disabled under reduced motion.
 */
export function GalleryCarousel({ label, zoomHint, children, count, itemLabel, zoomTitle }: Props) {
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
        className="grid gap-4"
        aria-roledescription="carrusel"
        aria-label={label}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard navigation for the carousel viewport (roving focus lives on the controls) */}
        <div
          className="overflow-hidden rounded-lg perspective-[1200px]"
          ref={emblaRef}
          onKeyDown={onKeyDown}
          data-state={settled ? "settled" : "scrolling"}
        >
          <ul className="-ml-4 flex touch-pan-y touch-pinch-zoom" role="list">
            {slides.map((slide, index) => (
              <li
                key={slide.key}
                className={SLIDE}
                data-active={index === selected ? "" : undefined}
                aria-roledescription="diapositiva"
                aria-label={position(index)}
              >
                {slide.node}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            className={ARROW}
            onClick={() => embla?.scrollPrev()}
            aria-label="Página anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <p className="min-w-[6ch] text-center font-extrabold text-ink" aria-live="polite">
            {position(selected)}
          </p>
          <button
            type="button"
            className={ARROW}
            onClick={() => embla?.scrollNext()}
            aria-label="Página siguiente"
          >
            <ChevronRight size={24} />
          </button>
        </div>
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
        {zoomHint ? <p className="text-center text-small text-subtle">{zoomHint}</p> : null}
        {zoom ? (
          <Suspense fallback={null}>
            <ZoomDialog open={zoomOpen} zoom={zoom} title={zoomTitle} onClose={() => setZoomOpen(false)} />
          </Suspense>
        ) : null}
      </section>
    </ZoomContext.Provider>
  );
}
