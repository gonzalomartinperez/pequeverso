import { cx } from "@/lib/cx";
import { Orbit } from "./orbit";
import { SceneStage } from "./scene/scene-stage";
import { StaticStarfield } from "./scene/static-starfield";

type Props = { variant?: "hero" | "band"; className?: string };

const SKY = { hero: "sky-hero", band: "sky-band" } as const;

/**
 * Decorative "pequeño universo" backdrop: a deep-navy sky, the seeded starfield (static SVG,
 * replaced by the lazy WebGL starfield when motion is allowed), two soft planets and the Orbit.
 * The backdrop layer is paint-contained; the only focusable element is the scene's pause control.
 */
export function Universe({ variant = "hero", className }: Props) {
  return (
    <div
      data-slot="universe"
      data-variant={variant}
      className={cx("pointer-events-none absolute inset-0", SKY[variant], className)}
    >
      <SceneStage>
        <StaticStarfield />
        <div className="planet-teal absolute -top-[18%] -right-[6%] size-[clamp(180px,26vw,360px)] rounded-full max-md:-right-[20%]" />
        <div className="planet-gold absolute -bottom-[8%] left-[6%] size-[clamp(90px,12vw,160px)] rounded-full opacity-90" />
        <Orbit className="absolute top-[6%] right-[4%] h-auto w-[clamp(280px,40vw,560px)] max-md:-top-[4%] max-md:-right-[30%]" />
      </SceneStage>
    </div>
  );
}
