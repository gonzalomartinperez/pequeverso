import { homeCopy as copy } from "@content/es/home";
import type { CSSProperties } from "react";
import { MediaImage } from "@/components/blocks/media-image";
import { PageWall } from "@/features/gallery/PageWall/page-wall";
import { FlipPreview } from "@/motion/flip-preview";
import { Float } from "@/motion/float";
import { pageAt, product } from "./home-data";
import { Accent, LINK_OUTLINE, Pill, ProductLink } from "./home-ui";

/** Real pages of the flip cards: front and back of each. */
const PREVIEW_PAGES = [
  [pageAt(0), pageAt(1)],
  [pageAt(6), pageAt(7)],
  [pageAt(12), pageAt(13)],
] as const;
const PREVIEW_SIZES = "(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw";
/** Pages already shown by the flip cards stay out of the wall. */
const SHOWN = new Set<string>(PREVIEW_PAGES.flat());
const WALL_PAGES = product.media.pageIds.filter((id) => !SHOWN.has(id));

/**
 * Proof band: the heading beside the fanned stack of printed pages, three real pages that turn
 * over, the drifting wall of the rest and one link to the product's gallery (`preview`).
 */
export function PagesShowcase() {
  return (
    <section
      id="paginas"
      aria-labelledby="preview-title"
      className="cq defer-render relative scroll-mt-(--header-height) overflow-x-clip bg-[radial-gradient(40%_30%_at_100%_18%,oklch(0.8521_0.0956_187.2/30%),transparent_70%),linear-gradient(180deg,var(--pv-cream)_0%,var(--pv-celeste)_30%,var(--pv-white)_70%,var(--pv-cream)_100%)] section-pad"
    >
      <div className="page-container">
        <div className="mb-10 grid items-center gap-6 cq-lg:mb-14 cq-lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="grid justify-items-start gap-3" data-reveal="">
            <Pill>{copy.preview.kicker}</Pill>
            <h2 id="preview-title">
              <Accent title={copy.preview.title} />
            </h2>
            <p className="lead max-w-[48ch] text-pretty">{copy.preview.lead}</p>
          </div>
          <Float range={10} rotate={-2} className="mx-auto w-full max-w-[34rem]">
            <MediaImage
              id="gf.cutout.stack"
              sizes="(min-width: 1024px) 520px, 92vw"
              alt=""
              className="h-auto w-full drop-shadow-[0_28px_36px_oklch(0.3175_0.1094_256.25/25%)]"
            />
          </Float>
        </div>
        <ul className="-mx-(--gutter) flex snap-x snap-mandatory scroll-px-(--gutter) gap-4 overflow-x-auto px-(--gutter) pt-2 pb-4 cq-md:mx-0 cq-md:grid cq-md:grid-cols-3 cq-md:gap-6 cq-md:overflow-visible cq-md:p-0">
          {PREVIEW_PAGES.map(([front, back], index) => (
            <li
              key={front}
              data-reveal=""
              style={{ "--i": index } as CSSProperties}
              className="w-[82%] shrink-0 snap-start rounded-xl bg-white p-2 pb-3 shadow-float ring-1 ring-line cq-md:w-auto"
            >
              <FlipPreview
                front={<MediaImage id={front} sizes={PREVIEW_SIZES} />}
                back={<MediaImage id={back} sizes={PREVIEW_SIZES} />}
                showLabel={copy.preview.flip.show}
                hideLabel={copy.preview.flip.hide}
                className="rounded-lg"
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-12 cq-lg:mt-16">
        <PageWall ids={WALL_PAGES} label={copy.preview.wall} rows={2} />
      </div>
      <p className="page-container mt-10 flex justify-center">
        <ProductLink position="preview" className={LINK_OUTLINE} hash="#paginas">
          {copy.preview.cta}
        </ProductLink>
      </p>
    </section>
  );
}
