import type { ReactNode } from "react";
import { MediaImage } from "@/components/blocks/media-image";
import { GoldStar, SyllableTile } from "./parts";

type Props = {
  /** Manifest id of the family cut-out (transparent PNG/WebP). */
  cutout: string;
  /** The age-aware `HeroStack` in its `orbit` layout. */
  stack: ReactNode;
  /** `sizes` of the cut-out inside the gallery. */
  sizes: string;
};

const PLANET = {
  background:
    "radial-gradient(circle at 32% 28%, oklch(0.97 0.035 187) 0%, var(--pv-turquoise) 34%, oklch(0.66 0.1 190) 72%, oklch(0.52 0.09 192) 100%)",
  boxShadow:
    "0 40px 90px -30px oklch(0.5324 0.0917 190.84 / 55%), inset -24px -30px 60px oklch(0.3 0.06 200 / 28%), inset 18px 18px 40px oklch(1 0 0 / 35%)",
} as const;

/**
 * First gallery slide: the family cut-out in front of a turquoise planet with its orbit, the
 * real worksheets of the selected age floating around it, syllable tiles and the gold star.
 * Everything but the photo and the worksheets is decorative.
 */
export function HeroComposition({ cutout, stack, sizes }: Props) {
  return (
    <div
      data-slot="hero-composition"
      className="cq relative isolate aspect-[10/9] overflow-hidden @min-[30rem]:aspect-square"
    >
      <div
        aria-hidden="true"
        className="absolute top-[7%] left-[17%] aspect-square w-[74%] rounded-full"
        style={PLANET}
      />
      <div
        aria-hidden="true"
        className="absolute top-[40%] -left-[8%] h-[24%] w-[116%] -rotate-[13deg] rounded-[50%] border-2 border-dashed border-teal/35"
      />
      {stack}
      <div className="absolute bottom-0 left-[23%] z-20 w-[58%] [&_img]:h-auto [&_img]:w-full [&_picture]:contents">
        <MediaImage id={cutout} sizes={sizes} priority />
      </div>
      <SyllableTile tone="gold" size="md" delay={1.5} rotate={-8} className="top-[4%] left-[35%] z-30">
        GA
      </SyllableTile>
      <SyllableTile tone="white" size="md" delay={3} rotate={7} className="right-[4%] bottom-[30%] z-30">
        TO
      </SyllableTile>
      <GoldStar delay={2} className="top-[5%] right-[27%] z-30 size-[clamp(1.75rem,6cqw,2.75rem)]" />
    </div>
  );
}
