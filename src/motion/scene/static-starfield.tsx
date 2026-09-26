import { cx } from "@/lib/cx";
import { buildStaticLayers, TILE_SIZE } from "./starfield";

/** Id of the page's starfield pattern: defined once by the hero, reused by every navy band. */
const PATTERN_ID = "pv-starfield";

type Props = {
  /** `define` ships the seeded tile (the hero, once per page); `reuse` paints with it (bands). */
  pattern?: "define" | "reuse" | undefined;
  className?: string | undefined;
};

/**
 * The starfield in its resting state: server-rendered SVG, no JavaScript, no canvas. A seeded
 * `TILE_SIZE` px tile repeats through an SVG pattern, so star density is identical from 320 to
 * 1920 px. It is what a visitor sees before the WebGL scene mounts, without WebGL and under
 * reduced motion, so it is a finished image, not a placeholder. Bands reuse the hero's pattern
 * by id instead of repeating the tile in the HTML; on a page without a hero they stay starless.
 */
export function StaticStarfield({ pattern = "define", className }: Props) {
  return (
    <svg
      data-slot="static-starfield"
      className={cx("absolute inset-0 size-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      {pattern === "define" ? (
        <defs>
          <pattern id={PATTERN_ID} width={TILE_SIZE} height={TILE_SIZE} patternUnits="userSpaceOnUse">
            {buildStaticLayers().map((layer) => (
              <path
                key={`${layer.depth}-${layer.tint}`}
                d={layer.path}
                className={layer.tint ? "fill-gold" : "fill-white"}
                fillOpacity={(0.35 + layer.depth * 0.55).toFixed(2)}
              />
            ))}
          </pattern>
        </defs>
      ) : null}
      <rect width="100%" height="100%" fill={`url(#${PATTERN_ID})`} />
    </svg>
  );
}
