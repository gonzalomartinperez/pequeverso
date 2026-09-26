import { homeCopy as copy } from "@content/es/home";
import { MediaImage } from "@/components/blocks/media-image";
import { Float } from "@/motion/float";
import { Orbit } from "@/motion/orbit";
import { StaticStarfield } from "@/motion/scene/static-starfield";
import { composition, pageAt, price, product } from "./home-data";
import { ProductLink, Sparkle } from "./home-ui";

const FAMILY_SIZES = "(min-width: 1280px) 400px, (min-width: 1024px) 34vw, (min-width: 640px) 380px, 64vw";

/**
 * The hub's "pequeño universo": a navy planet with its own stars (this band defines the page's
 * starfield pattern, reused by the navy bands below), a turquoise orbit whose gold star passes
 * behind the family cut-out, a real page and syllable tiles floating around them, and a glass
 * product tag with the registry price. Decorative layers are aria-hidden; the cut-out is the
 * LCP image on wide screens.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem]">
      <div className="relative aspect-[20/21]">
        {/* Planet */}
        <div
          aria-hidden="true"
          className="absolute top-[7%] left-[13%] aspect-square w-[74%] overflow-hidden rounded-full bg-[radial-gradient(circle_at_32%_28%,oklch(0.42_0.11_254)_0%,var(--pv-navy)_46%,oklch(0.19_0.07_256)_100%)] shadow-[inset_-28px_-36px_80px_oklch(0_0_0/38%),0_60px_120px_-40px_oklch(0.3175_0.1094_256.25/75%),0_0_0_14px_oklch(1_0_0/45%),0_0_90px_10px_oklch(0.8521_0.0956_187.2/45%)]"
        >
          <StaticStarfield className="opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_78%_22%,oklch(0.5324_0.0917_190.84/55%),transparent_70%)]" />
        </div>
        <div
          aria-hidden="true"
          className="planet-gold absolute top-[3%] left-[6%] aspect-square w-[11%] rounded-full"
        />
        <div
          aria-hidden="true"
          className="planet-turquoise absolute right-[4%] bottom-[34%] aspect-square w-[5.5%] rounded-full"
        />
        {/* Orbit: drawn between the planet and the family, so its star passes behind them. */}
        <Orbit className="absolute top-[18%] left-[-6%] w-[112%] [&_ellipse]:stroke-teal/55 [&_ellipse]:[stroke-width:1.6]" />
        {/* Family */}
        <div className="absolute bottom-0 left-[54%] w-[64%] -translate-x-1/2" data-hero-enter="media">
          <div
            aria-hidden="true"
            className="absolute -bottom-[2%] left-1/2 h-[6%] w-[90%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,oklch(0.3175_0.1094_256.25/30%),transparent)]"
          />
          <MediaImage
            id="gf.cutout.hero-alt"
            sizes={FAMILY_SIZES}
            priority
            className="relative h-auto w-full drop-shadow-[0_24px_30px_oklch(0.3175_0.1094_256.25/22%)]"
          />
        </div>
        {/* Real page and syllable tiles */}
        <Float
          delay={2}
          range={10}
          rotate={7}
          className="absolute top-[4%] right-[-2%] w-[30%] cq-xl:right-[-6%]"
        >
          <div className="overflow-hidden rounded-md border-4 border-white bg-white shadow-float [&_img]:h-auto [&_img]:w-full [&_img]:object-contain">
            <MediaImage id={pageAt(6)} sizes="(min-width: 1024px) 180px, 30vw" />
          </div>
        </Float>
        <div aria-hidden="true" className="contents">
          <Float delay={1} range={14} rotate={-8} className="absolute top-[30%] left-[1%]">
            <span className="grid size-[clamp(3rem,9cqw,4.5rem)] place-items-center rounded-lg bg-gold font-display text-[clamp(1.35rem,4cqw,2rem)] font-bold text-ink shadow-[0_14px_28px_-10px_oklch(0.3175_0.1094_256.25/45%)]">
              GA
            </span>
          </Float>
          <Float delay={3.5} range={12} rotate={6} className="absolute top-[44%] left-[13%]">
            <span className="grid size-[clamp(2.75rem,8cqw,4rem)] place-items-center rounded-lg bg-white font-display text-[clamp(1.2rem,3.6cqw,1.75rem)] font-bold text-navy shadow-[0_14px_28px_-10px_oklch(0.3175_0.1094_256.25/45%)]">
              TO
            </span>
          </Float>
          <Sparkle className="absolute top-[1%] left-[46%] size-[7%] text-gold drop-shadow-[0_0_10px_oklch(0.8908_0.1645_93.89/80%)]" />
          <Sparkle className="absolute top-[62%] right-[6%] size-[4%] text-teal" />
          <Sparkle className="absolute bottom-[18%] left-[4%] size-[3.5%] text-gold" />
        </div>
      </div>
      <ProductTag />
      <p className="mt-3 text-end text-tiny text-subtle cq-md:absolute cq-md:right-0 cq-md:-bottom-7 cq-md:mt-0">
        {copy.illustrative}
      </p>
    </div>
  );
}

/** Glass product tag: cover, name, size, registry price and the `hero-card` link. */
function ProductTag() {
  return (
    <div className="relative z-2 mx-auto -mt-12 w-[min(20rem,100%)] cq-md:absolute cq-md:bottom-[3%] cq-md:left-[-5%] cq-md:mx-0 cq-md:mt-0 cq-md:w-[19.5rem]">
      <Float delay={4} range={8}>
        <div className="glass grid gap-3 rounded-xl p-4 shadow-float">
          <div className="flex items-center gap-3">
            <div className="w-18 shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-line [&_img]:h-auto [&_img]:w-full [&_img]:object-contain">
              <MediaImage id={product.media.cards[0] ?? product.media.hero} sizes="72px" alt="" />
            </div>
            <div className="grid min-w-0 gap-0.5">
              <p className="flex items-center gap-1.5 text-tiny font-extrabold tracking-[0.06em] text-teal-text uppercase">
                <span aria-hidden="true" className="relative flex size-2">
                  <span className="absolute inset-0 rounded-full bg-teal opacity-60 motion-safe:animate-ping" />
                  <span className="relative size-2 rounded-full bg-teal" />
                </span>
                {copy.hero.tag.kicker}
              </p>
              <p className="font-display text-[1.3rem] leading-tight font-bold text-ink">
                {copy.featured.name}
              </p>
              <p className="text-tiny font-bold text-subtle">
                {composition.pdfCount} {copy.featured.units.pdf} · {composition.pageCount}{" "}
                {copy.featured.units.pages}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
            <p className="font-display text-[1.6rem] leading-none font-bold text-navy tabular-nums">
              {price}
            </p>
            <ProductLink
              position="hero-card"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-pill bg-navy px-4 text-small font-extrabold text-white no-underline transition-colors hover:bg-navy-deep hover:text-gold [&_svg]:size-4"
            >
              {copy.hero.tag.cta}
            </ProductLink>
          </div>
        </div>
      </Float>
    </div>
  );
}
