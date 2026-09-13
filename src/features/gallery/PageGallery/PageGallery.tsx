"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./PageGallery.module.css";

export type GalleryItem = {
  id: string;
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};

type Props = { items: GalleryItem[]; label: string; zoomHint?: string; sizes?: string };

/**
 * Accessible carousel of real worksheet pages: drag/swipe, arrows, dots, keyboard,
 * live counter, and a native <dialog> zoom. Slides use a light 3D depth effect
 * (inactive slides recede) that is disabled under reduced motion.
 */
export function PageGallery({ items, label, zoomHint, sizes = "(min-width: 1024px) 640px, 88vw" }: Props) {
  const [emblaRef, embla] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false,
  });
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState<GalleryItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

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

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      embla?.scrollNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      embla?.scrollPrev();
    }
  };

  return (
    <section className={styles.gallery} aria-roledescription="carrusel" aria-label={label}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard navigation for the carousel viewport (roving focus lives on the controls) */}
      <div className={styles.viewport} ref={emblaRef} onKeyDown={onKeyDown}>
        <ul className={styles.track} role="list">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={`${styles.slide} ${index === selected ? styles.active : ""}`}
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${items.length}`}
            >
              <button
                type="button"
                className={styles.zoomButton}
                onClick={() => setZoom(item)}
                aria-label={`Ampliar: ${item.alt}`}
              >
                <img
                  src={item.src}
                  srcSet={item.srcSet}
                  sizes={sizes}
                  width={item.width}
                  height={item.height}
                  alt={item.alt}
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
                <span className={styles.zoomIcon} aria-hidden="true">
                  <ZoomIn size={18} />
                </span>
              </button>
              {item.caption ? <p className={styles.caption}>{item.caption}</p> : null}
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
          {selected + 1} de {items.length}
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
        {items.map((item, index) => (
          <button
            key={item.id}
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
            <button type="button" className={styles.close} onClick={() => setZoom(null)} aria-label="Cerrar">
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
            <p className={styles.dialogCaption}>{zoom.caption ?? zoom.alt}</p>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
