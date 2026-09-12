import { getImage } from "@/lib/media";
import styles from "./BrandLogo.module.css";

type Props = { variant?: "full" | "mark"; className?: string; priority?: boolean };

/**
 * Isotipo from the media manifest (derived from the approved PNG master; no vector master
 * exists yet, see docs/media.md) plus the wordmark as real text, so the brand name is always
 * readable by assistive technology.
 */
export function BrandLogo({ variant = "full", className, priority = false }: Props) {
  const mark = getImage("brand.isotipo");
  const small = mark.renditions[0] ?? { src: mark.src, width: mark.width, height: mark.height };
  const medium = mark.renditions[1] ?? small;
  return (
    <span className={`${styles.logo} ${className ?? ""}`}>
      <img
        src={small.src}
        srcSet={`${small.src} 1x, ${medium.src} 2x`}
        width={40}
        height={40}
        alt=""
        aria-hidden="true"
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      />
      {variant === "full" ? <span className={`${styles.wordmark} pv-wordmark`}>pequeverso</span> : null}
    </span>
  );
}
