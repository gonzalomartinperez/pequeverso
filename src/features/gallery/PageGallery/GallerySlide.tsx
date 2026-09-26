import { getImage } from "@/lib/media";
import { GalleryZoomButton } from "./GalleryCarousel";

type Props = {
  /** Manifest image id, e.g. `gf.page.07`. */
  id: string;
  /** Visible caption; defaults to the alt text. */
  caption?: string | undefined;
  sizes?: string | undefined;
};

/**
 * Server-rendered slide for `PageGallery`: the responsive `<img>` (lazy, low fetch priority)
 * ships as HTML only, so the client bundle receives no image data. The gallery shows the
 * selected slide's caption under the stage; the zoom dialog reads `currentSrc`, `srcset`, `alt`
 * and `data-caption` from the element.
 */
export function GallerySlide({ id, caption, sizes = "(min-width: 1024px) 820px, 94vw" }: Props) {
  const image = getImage(id);
  const text = caption ?? image.alt;
  return (
    <GalleryZoomButton label={`Ampliar: ${image.alt}`}>
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading="lazy"
        fetchPriority="low"
        decoding="async"
        data-caption={text}
        data-alt={image.alt}
      />
    </GalleryZoomButton>
  );
}
