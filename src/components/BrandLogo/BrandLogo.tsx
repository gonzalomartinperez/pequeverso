import styles from "./BrandLogo.module.css";

type Props = { variant?: "full" | "mark"; className?: string; priority?: boolean };

/**
 * Logo derivatives are produced by tools/media from the approved PNG masters
 * (no vector master exists yet; see docs/media.md). The wordmark is real text so the
 * brand name is always readable by assistive technology.
 */
export function BrandLogo({ variant = "full", className, priority = false }: Props) {
  const mark = "/media/brand/pequeverso-isotipo-w96.webp";
  return (
    <span className={`${styles.logo} ${className ?? ""}`}>
      <img
        src={mark}
        srcSet={`${mark} 1x, /media/brand/pequeverso-isotipo-w192.webp 2x`}
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
