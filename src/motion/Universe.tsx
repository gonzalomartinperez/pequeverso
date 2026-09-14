import { Orbit } from "./Orbit";
import styles from "./Universe.module.css";

type Props = { variant?: "hero" | "band"; className?: string };

/**
 * Decorative "pequeño universo" backdrop: a deep-navy sky with a starfield, two soft planets
 * and the Orbit. Pure CSS (no images, no JS), paint-contained, aria-hidden.
 */
export function Universe({ variant = "hero", className }: Props) {
  return (
    <div
      className={`${styles.universe} ${styles[variant]} ${className ?? ""}`}
      aria-hidden="true"
      data-visual-mask
    >
      <div className={styles.stars} />
      <div className={styles.starsFar} />
      <div className={`${styles.planet} ${styles.planetA}`} />
      <div className={`${styles.planet} ${styles.planetB}`} />
      <Orbit className={styles.orbit} />
    </div>
  );
}
