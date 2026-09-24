import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** `loop`: a 48 s clock (hero, paused by the scene toggle); `scroll`: the star follows the scroll. */
  motion?: "loop" | "scroll" | undefined;
  className?: string | undefined;
};

const STAR = "M0-9 L2.6-2.8 9.2-2.8 3.9 1.1 5.9 7.5 0 3.7 -5.9 7.5 -3.9 1.1 -9.2-2.8 -2.6-2.8 Z";

/**
 * Decorative orbit: a dashed ellipse and the brand's gold star travelling along it on an
 * offset-path (`pv-orbit-traveller`). The loop stops under reduced motion or when the scene is
 * paused; the scroll variant only moves while the visitor scrolls. `data-scene-orbit` lets the
 * WebGL runtime take over the same ellipse.
 */
export function Orbit({ motion = "loop", className }: Props) {
  const glowId = useId();
  return (
    <svg
      data-slot="orbit"
      data-scene-orbit=""
      data-motion={motion}
      className={cn("pv-orbit block h-auto w-full overflow-visible", className)}
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0" className="[stop-color:var(--pv-gold)] [stop-opacity:0.55]" />
          <stop offset="1" className="[stop-color:var(--pv-gold)] [stop-opacity:0]" />
        </radialGradient>
      </defs>
      <g transform="rotate(-12 200 200)">
        <ellipse
          className="fill-none stroke-white/22 [stroke-dasharray:6_8]"
          strokeWidth="1"
          cx="200"
          cy="200"
          rx="190"
          ry="72"
        />
        <g className="pv-orbit-traveller">
          <circle r="18" fill={`url(#${glowId})`} />
          <path className="fill-gold" d={STAR} />
        </g>
      </g>
    </svg>
  );
}
