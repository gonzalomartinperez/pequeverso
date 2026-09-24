import { cx } from "@/lib/cx";

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
  flip?: boolean | undefined;
  className?: string | undefined;
};

const PATH = "M0 40 C 240 88 480 -8 720 40 C 960 88 1200 -8 1440 40 L1440 72 L0 72 Z";

/** Decorative wave edge (fixed `--wave-height`, stretches horizontally), aria-hidden. */
export function WaveDivider({ fill, flip = false, className }: Props) {
  return (
    <svg
      data-slot="wave-divider"
      className={cx("block h-(--wave-height) w-full", flip && "-scale-y-100", className)}
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
