import { MediaImage } from "@/components/blocks/media-image";
import { cn } from "@/lib/utils";
import { Float } from "@/motion/float";
import { Sparkle } from "./ui";

type Props = {
  /** Upsell: the real pack photo in an arch with two covers orbiting it. Downsell: a fan of covers. */
  variant: "upsell" | "downsell";
  /** Main pack photo (`pack.hero`). */
  hero: string;
  /** Resource covers (`pack.card.*`) in delivery order. */
  cards: readonly string[];
  /** Short glass caption over the composition (e.g. "6 PDF · 384 páginas"). */
  caption: string;
  /** Only the upsell hero image is the LCP candidate. */
  priority?: boolean | undefined;
  className?: string | undefined;
};

const COVER =
  "block overflow-hidden rounded-lg border-4 border-white bg-white shadow-float [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:object-cover";

/**
 * Floating composition of the pack for the offer heroes: a turquoise planet glow, a dashed orbit,
 * the real product photo and the covers bobbing around it (`Float`, still under reduced motion).
 * Only the main photo carries an accessible name; covers and caption are decorative repeats of
 * facts stated in the text.
 */
export function PackVisual({ variant, hero, cards, caption, priority = false, className }: Props) {
  const [first, second, third] = cards;
  return (
    <div
      data-slot="pack-visual"
      className={cn(
        "relative isolate mx-auto w-full max-w-[34rem]",
        variant === "upsell" ? "aspect-[10/11]" : "aspect-[5/4]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute top-[8%] left-1/2 -z-1 aspect-square w-[82%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,oklch(0.96_0.04_187),oklch(0.85_0.1_187/0.55)_45%,transparent_70%)] blur-[2px]"
      />
      <div
        aria-hidden="true"
        className="absolute top-[46%] left-[-4%] -z-1 h-[26%] w-[108%] -rotate-12 rounded-[50%] border-2 border-dashed border-teal/35"
      />
      <Sparkle className="top-[4%] left-[18%]" size={30} />
      <Sparkle className="top-[20%] right-[6%]" size={18} />
      <Sparkle className="bottom-[10%] left-[6%]" size={20} />

      {variant === "upsell" ? (
        <>
          <figure
            data-hero-enter="media"
            className="absolute top-[3%] left-1/2 w-[52%] -translate-x-1/2 overflow-hidden rounded-t-[999px] rounded-b-2xl border-[6px] border-white bg-white shadow-float [&_img]:block [&_img]:aspect-[2/3] [&_img]:h-auto [&_img]:w-full [&_img]:object-cover"
          >
            <MediaImage id={hero} sizes="(min-width: 1024px) 290px, 52vw" priority={priority} />
          </figure>
          {first ? (
            <Float delay={1.2} rotate={-8} className="absolute bottom-[14%] left-[0%] w-[40%]">
              <span className={COVER}>
                <MediaImage id={first} alt="" sizes="(min-width: 1024px) 220px, 40vw" />
              </span>
            </Float>
          ) : null}
          {second ? (
            <Float delay={3.4} rotate={7} range={10} className="absolute top-[22%] right-[0%] w-[36%]">
              <span className={COVER}>
                <MediaImage id={second} alt="" sizes="(min-width: 1024px) 200px, 36vw" />
              </span>
            </Float>
          ) : null}
        </>
      ) : (
        <>
          {second ? (
            <div className="absolute top-[25%] left-[0%] w-[50%] -rotate-10">
              <span className={COVER}>
                <MediaImage id={second} alt="" sizes="(min-width: 1024px) 270px, 50vw" />
              </span>
            </div>
          ) : null}
          {third ? (
            <div className="absolute top-[25%] right-[0%] w-[50%] rotate-10">
              <span className={COVER}>
                <MediaImage id={third} alt="" sizes="(min-width: 1024px) 270px, 50vw" />
              </span>
            </div>
          ) : null}
          {first ? (
            <Float range={10} className="absolute top-[16%] left-[18%] w-[64%]">
              <figure data-hero-enter="media" className={COVER}>
                <MediaImage id={first} sizes="(min-width: 1024px) 350px, 64vw" />
              </figure>
            </Float>
          ) : null}
        </>
      )}

      <p
        aria-hidden="true"
        className="glass absolute bottom-[2%] left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-pill px-5 py-2.5 text-small font-extrabold whitespace-nowrap text-navy shadow-float"
      >
        <span className="size-2 rounded-full bg-teal" />
        {caption}
      </p>
    </div>
  );
}
