"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import {
  Children,
  createContext,
  isValidElement,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./PageGallery.module.css";

type Zoom = { src: string; srcSet: string; width: number; height: number; alt: string; caption: string };

type Props = {
  label: string;
  zoomHint?: string;
  /** Server-rendered `<GallerySlide>` elements, one per page. */
  children: ReactNode;
  /** Number of slides in `children`; defaults to the child count. */
  count?: number;
};

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
    <button type="button" className={styles.zoomButton} onClick={onClick} aria-label={label}>
      {children}
      <span className={styles.zoomIcon} aria-hidden="true">
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
 * live counter, and a native <dialog> zoom. Slides use a light 3D depth effect
 * (inactive slides recede) that is disabled under reduced motion.
 */
export function GalleryCarousel({ label, zoomHint, children, count }: Props) {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false,
  });
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const open = useCallback((image: HTMLImageElement) => setZoom(zoomFrom(image)), []);
  const slides = Children.toArray(children).map((node, index) => ({
    key: String((isValidElement(node) && node.key) || index),
    node,
  }));
  const total = count ?? slides.length;

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    onSelect();
    embla.on("select", onSelect);
    embla.on("reInit", onSelect);
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", onSelect);
    };
  }, [embla, onSelect]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (zoom && !dialog.open) dialog.showModal();
    if (!zoom && dialog.open) dialog.close();
  }, [zoom]);

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
      <section className={styles.gallery} aria-roledescription="carrusel" aria-label={label}>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard navigation for the carousel viewport (roving focus lives on the controls) */}
        <div className={styles.viewport} ref={emblaRef} onKeyDown={onKeyDown}>
          <ul className={styles.track} role="list">
            {slides.map((slide, index) => (
              <li
                key={slide.key}
                className={`${styles.slide} ${index === selected ? styles.active : ""}`}
                aria-roledescription="diapositiva"
                aria-label={`${index + 1} de ${total}`}
              >
                {slide.node}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => embla?.scrollPrev()}
            aria-label="Página anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <p className={styles.counter} aria-live="polite">
            {selected + 1} de {total}
          </p>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => embla?.scrollNext()}
            aria-label="Página siguiente"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <div className={styles.dots} role="tablist" aria-label="Ir a una página">
          {slides.map((slide, index) => (
            <button
              key={slide.key}
              type="button"
              role="tab"
              aria-selected={index === selected}
              aria-label={`Ir a la página ${index + 1}`}
              className={`${styles.dot} ${index === selected ? styles.dotActive : ""}`}
              onClick={() => embla?.scrollTo(index)}
            />
          ))}
        </div>
        {zoomHint ? <p className={styles.hint}>{zoomHint}</p> : null}
        <dialog
          ref={dialogRef}
          className={styles.dialog}
          onClose={() => setZoom(null)}
          aria-label={zoom?.alt ?? "Página ampliada"}
        >
          {zoom ? (
            <div className={styles.dialogInner}>
              <button
                type="button"
                className={styles.close}
                onClick={() => setZoom(null)}
                aria-label="Cerrar"
              >
                <X size={22} />
              </button>
              <img
                src={zoom.src}
                srcSet={zoom.srcSet}
                sizes="90vw"
                width={zoom.width}
                height={zoom.height}
                alt={zoom.alt}
              />
              <p className={styles.dialogCaption}>{zoom.caption}</p>
            </div>
          ) : null}
        </dialog>
      </section>
    </ZoomContext.Provider>
  );
}
