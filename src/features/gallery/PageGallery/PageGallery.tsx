import type { ReactNode } from "react";
import { GalleryCarousel } from "./GalleryCarousel";
import { GallerySlide } from "./GallerySlide";

/** Legacy input: a resolved image plus caption; only `id` and `caption` are used. */
export type GalleryItem = { id: string; caption?: string };

type Props = {
  label: string;
  zoomHint?: string;
  sizes?: string;
  /** `<GallerySlide>` elements, one per page (preferred). */
  children?: ReactNode;
  /** Number of slides in `children`; defaults to the child count. */
  count?: number;
  /** Legacy path: rendered as `<GallerySlide>` on the server, so the client receives no image data. */
  items?: GalleryItem[];
};

/**
 * Server entry for the worksheet-page carousel: resolves slides on the server and hands
 * `GalleryCarousel` (client) only the rendered slides, the count and the labels.
 */
export function PageGallery({ label, zoomHint, sizes, children, count, items }: Props) {
  const slides =
    items?.map((item) => <GallerySlide key={item.id} id={item.id} caption={item.caption} sizes={sizes} />) ??
    children;
  return (
    <GalleryCarousel label={label} zoomHint={zoomHint} count={items?.length ?? count}>
      {slides}
    </GalleryCarousel>
  );
}
