import styles from "./WaveDivider.module.css";

export type WaveFill =
  | "cream"
  | "white"
  | "mint"
  | "sky"
  | "lemon"
  | "rose"
  | "navy"
  | "navy-deep"
  | "hero-bottom";

type Props = {
  /** Colour token (`--pv-<fill>`) of the band the wave belongs to. */
  fill: WaveFill;
  /** Flip vertically for a wave that sits at the top of a section. */
  flip?: boolean;
  className?: string;
};

const PATH = "M0 40 C 240 88 480 -8 720 40 C 960 88 1200 -8 1440 40 L1440 72 L0 72 Z";

/** Decorative wave edge (fixed height, stretches horizontally), aria-hidden. */
export function WaveDivider({ fill, flip = false, className }: Props) {
  return (
    <svg
      className={`${styles.wave} ${flip ? styles.flip : ""} ${className ?? ""}`}
      viewBox="0 0 1440 72"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      style={{ fill: `var(--pv-${fill})` }}
    >
      <path d={PATH} />
    </svg>
  );
}
