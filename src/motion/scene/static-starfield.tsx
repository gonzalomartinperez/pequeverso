import { cx } from "@/lib/cx";
import { buildStaticLayers } from "./starfield";

type Props = { className?: string };

/**
 * The starfield in its resting state: server-rendered SVG, no JavaScript, no canvas. It is what
 * a visitor sees before the WebGL scene mounts, when WebGL is unavailable and whenever reduced
 * motion is preferred, so it is a finished image, not a placeholder. `pv-scene-static` fades it
 * out once the runtime takes over (motion.css).
 */
export function StaticStarfield({ className }: Props) {
  const layers = buildStaticLayers();
  return (
    <svg
      data-slot="static-starfield"
      className={cx("pv-scene-static absolute inset-0 size-full", className)}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {layers.map((layer) => (
        <path
          key={`${layer.depth}-${layer.tint}`}
          d={layer.path}
          className={layer.tint ? "fill-gold" : "fill-white"}
          fillOpacity={(0.35 + layer.depth * 0.55).toFixed(2)}
        />
      ))}
    </svg>
  );
}
