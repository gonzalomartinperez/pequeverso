import { Children, isValidElement, type ReactNode } from "react";
import { getImage } from "@/lib/media";
import { GalleryCarousel, type SlideMeta } from "./GalleryCarousel";
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
  /** Noun before the counter ("Página real" → "Página real 3 de 20"). */
  itemLabel?: string | undefined;
  /** Visible title of the zoom dialog (e.g. "Página real del kit"). */
  zoomTitle?: string | undefined;
};

type SlideProps = { id: string; caption?: string | undefined };

/** Thumbnail (smallest rendition) and caption of each `<GallerySlide>` child, read on the server. */
function metaOf(children: ReactNode): SlideMeta[] | undefined {
  const meta: SlideMeta[] = [];
  for (const node of Children.toArray(children)) {
    if (!isValidElement<SlideProps>(node) || node.type !== GallerySlide) return undefined;
    const image = getImage(node.props.id);
    const thumb = image.renditions[0] ?? { src: image.src, width: image.width, height: image.height };
    meta.push({
      thumb: thumb.src,
      width: thumb.width,
      height: thumb.height,
      caption: node.props.caption ?? image.alt,
    });
  }
  return meta;
}

/**
 * Server entry for the worksheet-page gallery: resolves slides on the server and hands
 * `GalleryCarousel` (client) the rendered slides, the thumbnails/captions and the labels.
 */
export function PageGallery({ label, zoomHint, sizes, children, count, items, itemLabel, zoomTitle }: Props) {
  const slides =
    items?.map((item) => <GallerySlide key={item.id} id={item.id} caption={item.caption} sizes={sizes} />) ??
    children;
  return (
    <GalleryCarousel
      label={label}
      zoomHint={zoomHint}
      count={items?.length ?? count}
      itemLabel={itemLabel}
      zoomTitle={zoomTitle}
      meta={metaOf(slides)}
    >
      {slides}
    </GalleryCarousel>
  );
}
