import { localCurrencyNoteShort } from "@config/commerce";
import { homeCopy as copy } from "@content/es/home";
import { MediaImage } from "@/components/blocks/media-image";
import { Section } from "@/components/blocks/section";
import { SocialLinks } from "@/components/blocks/social-links";
import { Float } from "@/motion/float";
import { Universe } from "@/motion/universe";
import { composition, price } from "./home-data";
import { Accent, LINK_WHITE, Pill, ProductLink } from "./home-ui";

/**
 * Closing band: the navy universe rises over the paper on a soft arc and runs into the footer.
 * One white link to the product (`closing`), the registry price, and the social profiles.
 */
export function ClosingBand() {
  const c = copy.closing;
  return (
    <Section
      tone="navy"
      labelledBy="cierre-title"
      divider="arc"
      backdrop={<Universe variant="band" />}
      className="cq"
      defer
    >
      <div className="grid items-center gap-10 cq-lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="grid justify-items-center gap-5 text-center cq-lg:justify-items-start cq-lg:text-start">
          <Pill tone="gold">{c.kicker}</Pill>
          <h2 id="cierre-title" className="max-w-[18ch]">
            <Accent title={c.title} tone="dark" />
          </h2>
          <p className="lead max-w-[48ch] text-pretty">
            {c.text} {composition.pdfCount} PDF y {composition.pageCount} páginas {c.textAfter}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 cq-lg:justify-start">
            <ProductLink position="closing" className={LINK_WHITE}>
              {c.cta}
            </ProductLink>
            <p className="grid text-start">
              <span className="font-display text-[1.75rem] leading-none font-bold text-gold tabular-nums">
                {price}
                <span className="ml-2 font-sans text-small font-extrabold text-white">{c.priceSuffix}</span>
              </span>
              <span className="mt-1 text-small font-semibold text-body">{localCurrencyNoteShort}</span>
            </p>
          </div>
          <div className="mt-6 grid w-full justify-items-center gap-3 border-t border-white/15 pt-7 cq-lg:justify-items-start">
            <p className="text-small">{c.social}</p>
            <SocialLinks tone="dark" />
          </div>
        </div>
        <div aria-hidden="true" className="relative mx-auto w-full max-w-[30rem]">
          <div className="planet-teal absolute top-[8%] left-[14%] aspect-square w-[72%] rounded-full opacity-80" />
          <Float range={12} className="relative">
            <MediaImage
              id="gf.cutout.elementos"
              sizes="(min-width: 1024px) 480px, 90vw"
              alt=""
              className="h-auto w-full drop-shadow-[0_30px_40px_oklch(0_0_0/40%)]"
            />
          </Float>
        </div>
      </div>
    </Section>
  );
}
