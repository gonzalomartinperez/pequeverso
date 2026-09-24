import { useId } from "react";
import { cx } from "@/lib/cx";
import { buildStaticLayers, TILE_SIZE } from "./starfield";

type Props = { className?: string };

/**
 * The starfield in its resting state: server-rendered SVG, no JavaScript, no canvas. A seeded
 * `TILE_SIZE` px tile repeats through an SVG pattern, so star density is identical from 320 to
 * 1920 px and the markup stays a few hundred bytes. It is what a visitor sees before the WebGL
 * scene mounts, without WebGL and under reduced motion, so it is a finished image, not a
 * placeholder. `pv-scene-static` fades it out once the runtime takes over (motion.css).
 */
export function StaticStarfield({ className }: Props) {
  const tile = useId();
  const layers = buildStaticLayers();
  return (
    <svg
      data-slot="static-starfield"
      className={cx("pv-scene-static absolute inset-0 size-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={tile} width={TILE_SIZE} height={TILE_SIZE} patternUnits="userSpaceOnUse">
          {layers.map((layer) => (
            <path
              key={`${layer.depth}-${layer.tint}`}
              d={layer.path}
              className={layer.tint ? "fill-gold" : "fill-white"}
              fillOpacity={(0.35 + layer.depth * 0.55).toFixed(2)}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${tile})`} />
    </svg>
  );
}
