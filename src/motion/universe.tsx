import { cx } from "@/lib/cx";
import { Orbit } from "./orbit";
import { SceneStage } from "./scene/scene-stage";
import { StaticStarfield } from "./scene/static-starfield";

type Props = {
  /** `hero`: live WebGL scene over the static layers; `band`: static stars and a scroll-driven orbit. */
  variant?: "hero" | "band" | undefined;
  className?: string | undefined;
};

/**
 * Decorative "pequeño universo" backdrop: a deep-navy sky, the seeded starfield, three soft
 * planets (teal, gold, turquoise; hero only) and the gold star on its orbit. The hero variant hands the same
 * layers to the lazy WebGL scene (`SceneStage`, `data-scene-*` hooks mark what it replaces);
 * bands stay server-rendered. Everything is aria-hidden; the only control is the pause toggle.
 */
export function Universe({ variant = "hero", className }: Props) {
  if (variant === "band") {
    return (
      <div
        data-slot="universe"
        data-variant="band"
        aria-hidden="true"
        className={cx(
          "pointer-events-none absolute inset-0 overflow-hidden sky-band contain-paint",
          className,
        )}
      >
        <StaticStarfield pattern="reuse" />
        <Orbit
          motion="scroll"
          className="absolute -top-[20%] -right-[12%] w-[clamp(280px,42vw,620px)] max-md:-right-[40%]"
        />
      </div>
    );
  }
  return (
    <div
      data-slot="universe"
      data-variant="hero"
      className={cx("pointer-events-none absolute inset-0 sky-hero", className)}
    >
      <SceneStage>
        <StaticStarfield />
        <div
          data-scene-planet="teal"
          data-scene-depth="-6"
          data-scene-lift="0.8"
          className="planet-teal absolute -top-[18%] -right-[6%] size-[clamp(180px,26vw,360px)] rounded-full max-md:-right-[20%]"
        />
        <div
          data-scene-planet="turquoise"
          data-scene-depth="-14"
          data-scene-lift="0.3"
          data-scene-bands="0"
          className="planet-turquoise absolute top-[40%] right-[7%] size-[clamp(26px,3.2vw,48px)] rounded-full max-md:hidden"
        />
        <div
          data-scene-planet="gold"
          data-scene-depth="2"
          data-scene-lift="2.4"
          data-scene-bands="0.03"
          className="planet-gold absolute -bottom-[8%] left-[6%] size-[clamp(90px,12vw,160px)] rounded-full"
        />
        <Orbit className="absolute top-[6%] right-[4%] w-[clamp(280px,40vw,560px)] max-md:-top-[10%] max-md:-right-[42%] md:max-lg:top-0 md:max-lg:-right-[16%]" />
      </SceneStage>
    </div>
  );
}
