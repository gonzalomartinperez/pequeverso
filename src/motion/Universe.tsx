import styles from "./Universe.module.css";

type Props = { variant?: "hero" | "band"; className?: string };

/**
 * Decorative "pequeño universo" backdrop: a deep-navy sky with a starfield, two soft
 * planets and an orbit ring with the brand's gold star. Pure CSS (no images, no JS);
 * the slow orbit animation is disabled under reduced motion. aria-hidden.
 */
export function Universe({ variant = "hero", className }: Props) {
  return (
    <div className={`${styles.universe} ${styles[variant]} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.stars} />
      <div className={styles.starsFar} />
      <div className={`${styles.planet} ${styles.planetA}`} />
      <div className={`${styles.planet} ${styles.planetB}`} />
      <div className={styles.orbit}>
        <span className={styles.star} />
      </div>
    </div>
  );
}
