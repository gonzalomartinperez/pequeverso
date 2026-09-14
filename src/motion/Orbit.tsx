import { useId } from "react";
import styles from "./Orbit.module.css";

type Props = { className?: string };

const STAR = "M0-9 L2.6-2.8 9.2-2.8 3.9 1.1 5.9 7.5 0 3.7 -5.9 7.5 -3.9 1.1 -9.2-2.8 -2.6-2.8 Z";

/**
 * Decorative orbit: a dashed ellipse and the brand's gold star travelling along it on an
 * offset-path (48 s loop, paused under reduced motion). The glow is a static radial gradient.
 */
export function Orbit({ className }: Props) {
  const glowId = useId();
  return (
    <svg
      className={`${styles.orbit} ${className ?? ""}`}
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0" className={styles.glowCore} />
          <stop offset="1" className={styles.glowEdge} />
        </radialGradient>
      </defs>
      <g transform="rotate(-12 200 200)">
        <ellipse className={styles.ring} cx="200" cy="200" rx="190" ry="72" />
        <g className={styles.traveller}>
          <circle r="18" fill={`url(#${glowId})`} />
          <path className={styles.star} d={STAR} />
        </g>
      </g>
    </svg>
  );
}
