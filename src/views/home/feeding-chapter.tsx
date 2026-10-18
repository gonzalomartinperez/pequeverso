import { affiliateHref, alimentacionBebe as course } from "@config/affiliates.ts";
import { homeCopy as copy } from "@content/es/home";
import { hubCopy } from "@content/es/hub";
import Link from "next/link";
import { AffiliateLink } from "@/features/commerce/presentation/affiliate-link.tsx";
import { Icon } from "@/shared/editorial/icon.tsx";
import { MediaImage } from "@/shared/media/media-image.tsx";
import { LINK_NAVY } from "./home-ui";
import { HowBand } from "./how-band";
import { ProductStory, StoryStage } from "./product-story";

/**
 * Chapter `#bebe` (alias `#alimentacion-bebe`): the recommended course from the first-meals need,
 * with the same structure and weight as `#leer`, mirrored. The story (an illustrative topic mockup,
 * pain → desire, the syllabus from config, the Hotmart guarantee, one navy
 * link to the affiliate redirect with the mandatory disclosure right under it) and «Mira ·
 * Organiza · Cocina» with the menu. No price, reviews, results or health promises. Facts come from
 * `config/affiliates.ts`.
 */
export function FeedingChapter() {
  const a = copy.affiliate;
  return (
    <>
      <ProductStory
        id={hubCopy.feeding.anchor}
        alias={course.slug}
        need="feeding"
        affiliate={course.slug}
        mediaFirst={false}
        media={<FeedingStage />}
        kicker={a.kicker}
        chips={[course.stage, hubCopy.feeding.format]}
        title={a.title}
        pain={a.pain}
        desire={a.desire}
        listLabel={a.topicsLabel}
        list={course.topics}
        product={<FeedingBox />}
        action={
          <AffiliateLink
            href={affiliateHref(course)}
            product={course.slug}
            position="home"
            newTabLabel={a.newTab}
            className={`${LINK_NAVY} w-full cq-sm:w-fit`}
          >
            {a.cta}
          </AffiliateLink>
        }
        note={a.ctaNote}
        after={
          <p
            data-affiliate-disclosure=""
            className="flex items-start gap-2 rounded-md bg-white/80 p-3 text-small text-pretty text-body ring-1 ring-line"
          >
            <Icon name="link" size={16} className="mt-[0.2em] shrink-0 text-teal-text" />
            <span>
              {a.disclosure}{" "}
              <Link href="/aviso-legal/#afiliados" className="font-bold">
                {a.disclosureLink}
              </Link>
              .
            </span>
          </p>
        }
        secondary={
          <a
            href="#bebe-como"
            className="inline-flex min-h-11 items-center gap-2 font-extrabold text-navy underline decoration-teal/40 decoration-2 underline-offset-6 hover:text-teal-text hover:decoration-teal"
          >
            {a.secondary}
            <Icon name="arrowDown" size={16} strokeWidth={2.6} />
          </a>
        }
      />
      <FeedingHow />
    </>
  );
}

/** Owner-supplied topic illustration; course format and facts remain in the adjacent copy. */
function FeedingStage() {
  return (
    <StoryStage need="feeding" caption={copy.illustrative}>
      <div className="absolute inset-4">
        <MediaImage
          id="home.feeding.overview"
          sizes="(min-width: 1024px) 540px, 90vw"
          className="size-full object-contain"
        />
      </div>
    </StoryStage>
  );
}

/** Product box: name, format, stage and the producer's Hotmart guarantee (no price). */
function FeedingBox() {
  const a = copy.affiliate;
  return (
    <div className="grid gap-2 rounded-xl bg-white p-5 shadow-sm ring-1 ring-line">
      <p className="font-display text-[1.5rem] leading-tight font-bold text-heading">{course.name}</p>
      <p className="text-small font-bold text-subtle">
        {a.kind} · {course.audience}
      </p>
      <p className="flex items-center gap-2 text-small font-bold text-ink">
        <Icon name="shield" size={16} className="shrink-0 text-teal" />
        {a.guaranteeBefore} {course.guaranteeDays} {a.guaranteeAfter}
      </p>
    </div>
  );
}

function FeedingHow() {
  const h = copy.affiliate.how;
  return (
    <HowBand
      id="bebe-como"
      kicker={h.kicker}
      title={h.title}
      lead={h.lead}
      steps={h.steps}
      cutout={<MediaImage id={course.media.detail} sizes="(min-width: 1024px) 480px, 240px" alt="" />}
      caption={copy.illustrative}
      extra={
        <figure className="on-light grid overflow-hidden rounded-2xl bg-[linear-gradient(160deg,var(--pv-cream),var(--pv-peach))] shadow-float cq-md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="relative min-h-0 [&_img]:aspect-[4/3] [&_img]:h-auto [&_img]:w-full [&_img]:object-cover cq-md:min-h-[24rem] cq-md:[&_img]:absolute cq-md:[&_img]:inset-0 cq-md:[&_img]:aspect-auto cq-md:[&_img]:size-full">
            <MediaImage id={course.media.menu} sizes="(min-width: 768px) 46vw, 92vw" />
          </div>
          <figcaption className="grid content-center gap-3 p-6 cq-sm:p-10">
            <p className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] leading-tight font-bold text-heading">
              {h.menuTitle}
            </p>
            <p className="text-pretty">{h.menuText}</p>
            <p className="text-tiny text-subtle">{copy.illustrative}</p>
          </figcaption>
        </figure>
      }
    />
  );
}
