import { getImage } from "@/lib/media";

type Props = {
  id: string;
  /** `sizes` attribute describing the rendered width per breakpoint. */
  sizes: string;
  /** LCP image: eager + high priority; everything else lazy. */
  priority?: boolean;
  className?: string;
  /** Override alt (e.g. decorative → ""). */
  alt?: string;
};

/**
 * Renders a manifest-backed responsive image with explicit dimensions (no CLS), WebP
 * srcset, optional AVIF <source> and the right loading priority. Images are pre-optimized
 * by tools/media; nothing is processed at request time on either build target.
 */
export function MediaImage({ id, sizes, priority = false, className, alt }: Props) {
  const image = getImage(id);
  const img = (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      className={className}
      decoding={priority ? "sync" : "async"}
      {...(priority
        ? { fetchPriority: "high" as const, loading: "eager" as const }
        : { loading: "lazy" as const })}
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
