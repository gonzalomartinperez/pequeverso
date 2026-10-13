import { localCurrencyNoteShort } from "@config/commerce";
import { homeCopy as copy } from "@content/es/home";
import { hubCopy } from "@content/es/hub";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { SyllablePlayground } from "@/features/playground/syllable-playground";
import { Float } from "@/motion/float";
import { bonuses, composition, pageAt, price, product } from "./home-data";
import { LINK_NAVY, ProductLink } from "./home-ui";
import { HowBand } from "./how-band";
import { ProductStory, StoryStage } from "./product-story";

/**
 * Chapter `#leer` (alias `#grafismo-fonetico`): Grafismo Fonético from the reading need. The
 * story (a girl tracing a real page, the real page itself, pain → desire, what you get, the bundle
 * and the registry price, one navy link to the product page) and «Mira · Di · Traza · Une» with the
 * syllable playground on real worksheets. The home never buys directly: the coral checkout lives
 * on the landing.
 */
export function ReadingChapter() {
  const r = copy.reading;
  return (
    <>
      <ProductStory
        id={hubCopy.reading.anchor}
        alias={product.slug}
        need="reading"
        mediaFirst
        media={<ReadingStage />}
        kicker={r.kicker}
        chips={[composition.ageRange, hubCopy.reading.format]}
        title={r.title}
        pain={r.pain}
        desire={r.desire}
        listLabel={r.benefitsLabel}
        list={r.benefits}
        product={<ReadingBox />}
        action={
          <ProductLink position="story" className={`${LINK_NAVY} w-full cq-sm:w-fit`}>
            {r.cta} · {price}
          </ProductLink>
        }
        note={r.ctaNote}
        secondary={
          <ProductLink
            position="story-includes"
            hash="#incluye"
            className="inline-flex min-h-11 items-center gap-2 font-extrabold text-navy underline decoration-teal/40 decoration-2 underline-offset-6 hover:text-teal-text hover:decoration-teal [&_svg]:size-4"
          >
            {r.secondary}
          </ProductLink>
        }
      />
      <ReadingHow />
    </>
  );
}

/** Real page + the girl tracing it, on the sky stage. */
function ReadingStage() {
  return (
    <StoryStage need="reading" caption={copy.illustrative}>
      <div className="absolute bottom-0 left-[4%] w-[74%]">
        <MediaImage
          id="gf.cutout.trazo"
          sizes="(min-width: 1024px) 420px, 70vw"
          className="h-auto w-full drop-shadow-[0_24px_30px_oklch(0.3175_0.1094_256.25/25%)]"
        />
      </div>
      <Float delay={2} range={10} rotate={6} className="absolute top-[6%] right-[5%] w-[40%]">
        <div className="overflow-hidden rounded-md border-4 border-white bg-white shadow-float [&_img]:h-auto [&_img]:w-full">
          <MediaImage id={pageAt(6)} sizes="(min-width: 1024px) 220px, 38vw" />
        </div>
        <p className="mt-2 w-fit rounded-pill bg-white px-3 py-1 text-tiny font-extrabold text-navy shadow-sm">
          {copy.reading.proof}
        </p>
      </Float>
    </StoryStage>
  );
}

/** Product box: name, kind, size and bundle from the registry, price and the currency note. */
function ReadingBox() {
  const r = copy.reading;
  return (
    <div className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-line cq-sm:grid-cols-[minmax(0,1fr)_auto] cq-sm:items-center">
      <div className="grid min-w-0 gap-2">
        <p className="font-display text-[1.5rem] leading-tight font-bold text-heading">{product.name}</p>
        <p className="text-small font-bold text-subtle">
          {r.kind} · {composition.pdfCount} {r.units.pdf} · {composition.pageCount} {r.units.pages}
        </p>
        <p className="flex items-center gap-2 text-small font-bold text-ink">
          <Icon name="sparkles" size={16} className="shrink-0 text-teal" />
          {r.bundle.main} + {bonuses.length} {r.bundle.bonuses}
        </p>
      </div>
      <p className="grid gap-0.5 cq-sm:justify-items-end cq-sm:text-end">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-price leading-none font-bold text-navy tabular-nums">
            {price}
          </span>
          <span className="text-small font-extrabold text-subtle">{r.priceSuffix}</span>
        </span>
        <span className="text-tiny text-subtle">{localCurrencyNoteShort}</span>
      </p>
    </div>
  );
}

function ReadingHow() {
  const m = copy.method;
  const words = m.playground.words.map((word) => ({
    syllables: word.syllables,
    word: word.word,
    page: <MediaImage id={pageAt(word.page)} sizes="(min-width: 1024px) 520px, 90vw" />,
  }));
  return (
    <HowBand
      id="leer-como"
      kicker={m.kicker}
      title={m.title}
      lead={m.lead}
      steps={m.steps}
      starfield="define"
      cutout={<MediaImage id="gf.cutout.tarjetas" sizes="(min-width: 1024px) 480px, 240px" />}
      caption={copy.illustrative}
      extra={
        <SyllablePlayground
          words={words}
          title={m.playground.title}
          hint={m.playground.hint}
          doneLabel={m.playground.doneLabel}
        />
      }
    />
  );
}
