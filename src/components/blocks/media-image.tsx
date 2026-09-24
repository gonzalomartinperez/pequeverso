import { preload } from "react-dom";
import { getImage } from "@/lib/media";

type Props = {
  id: string;
  /** `sizes` attribute describing the rendered width per breakpoint. */
  sizes: string;
  /** LCP image: eager, high priority, preloaded from the document head; everything else lazy. */
  priority?: boolean;
  className?: string;
  /** Override alt (e.g. decorative → ""). */
  alt?: string;
};

/**
 * Renders a manifest-backed responsive image with explicit dimensions (no CLS): a `<picture>`
 * with the AVIF `<source>` when the pipeline produced one, WebP `<img>` otherwise. Non-priority
 * images are lazy. The priority (LCP) image is eager with `fetchpriority="high"`, carries
 * `data-lcp`, and is preloaded from the head with the same srcset/sizes the browser will pick
 * (typed `image/avif` when available), because React only preloads bare `<img>` elements.
 */
export function MediaImage({ id, sizes, priority = false, className, alt }: Props) {
  const image = getImage(id);
  const avif = image.sources?.find((source) => source.type === "image/avif");
  if (priority) {
    preload(image.src, {
      as: "image",
      fetchPriority: "high",
      imageSizes: sizes,
      ...(avif ? { type: avif.type, imageSrcSet: avif.srcSet } : { imageSrcSet: image.srcSet }),
    });
  }
  const img = (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      className={className}
      {...(priority
        ? {
            decoding: "sync" as const,
            fetchPriority: "high" as const,
            loading: "eager" as const,
            "data-lcp": "",
          }
        : { decoding: "async" as const, loading: "lazy" as const })}
    />
  );
  if (!image.sources?.length) return img;
  return (
    <picture>
      {image.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={sizes} />
      ))}
      {img}
    </picture>
  );
}
