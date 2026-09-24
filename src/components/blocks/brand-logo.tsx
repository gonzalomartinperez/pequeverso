import { getImage } from "@/lib/media";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "full" | "mark";
  /** Hide the wordmark on narrow viewports (header) or always show it (footer). */
  wordmark?: "always" | "sm-up";
  className?: string;
  /**
   * Above-the-fold mark (header): loads eagerly but with low fetch priority and no head
   * preload, so the page hero keeps the single LCP preload. Footer and other uses stay lazy.
   */
  priority?: boolean;
};

/**
 * Isotipo from the media manifest (derived from the approved PNG master; no vector master
 * exists yet, see docs/media.md) plus the wordmark as real text, so the brand name is always
 * readable by assistive technology.
 */
export function BrandLogo({ variant = "full", wordmark = "always", className, priority = false }: Props) {
  const mark = getImage("brand.isotipo");
  const small = mark.renditions[0] ?? { src: mark.src, width: mark.width, height: mark.height };
  const medium = mark.renditions[1] ?? small;
  return (
    <span
      data-slot="brand-logo"
      className={cn("inline-flex items-center gap-2 text-navy no-underline", className)}
    >
      <img
        src={small.src}
        srcSet={`${small.src} 1x, ${medium.src} 2x`}
        width={40}
        height={40}
        alt=""
        aria-hidden="true"
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority="low"
        className="size-10 rounded-full"
      />
      {variant === "full" ? (
        <span
          className={cn(
            "font-display text-2xl leading-none font-bold tracking-[-0.01em]",
            wordmark === "sm-up" && "hidden sm:inline",
          )}
        >
          pequeverso
        </span>
      ) : null}
    </span>
  );
}
