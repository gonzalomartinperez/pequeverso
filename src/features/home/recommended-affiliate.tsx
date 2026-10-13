import { affiliateHref, alimentacionBebe as course } from "@config/affiliates";
import { homeCopy as copy } from "@content/es/home";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { AffiliateLink } from "@/features/commerce/AffiliateLink/AffiliateLink";
import { Float } from "@/motion/float";
import { Accent, LINK_NAVY, Pill, Sparkle } from "./home-ui";

/**
 * "Recomendado por Pequeverso": a third-party course the site recommends as a Hotmart
 * affiliate, placed after Grafismo Fonético's own sections and before the close. A white card:
 * the feeding scene (with the course on a tablet and a bowl floating over it) beside what the
 * course covers, Hotmart's guarantee, the navy "Ver el curso" link to the redirect path (never
 * the coral purchase CTA) and the mandatory affiliate disclosure linked to the legal notice.
 * Facts come from `config/affiliates.ts`; everything is below the fold, so images stay lazy.
 */
export function RecommendedAffiliate() {
  const a = copy.affiliate;
  return (
    <section
      id="recomendado"
      aria-labelledby="recomendado-title"
      className="cq relative scroll-mt-(--header-height) bg-cream pb-[calc(var(--section-pad)+var(--section-overlap))]"
    >
      <div className="page-container">
        <article
          aria-labelledby="recomendado-title"
          data-affiliate-block={course.slug}
          className="grid overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-line cq-lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          data-reveal="blur"
        >
          {/* Scene */}
          <figure className="relative isolate min-w-0 cq-lg:min-h-[40rem] bg-[linear-gradient(160deg,var(--pv-peach),var(--pv-celeste))]">
            {/* Art direction: landscape scene below lg (faces kept by object-position), the
                portrait art of the same scene beside the copy from lg. The hidden one is
                display:none, so its lazy image is never requested. */}
            <div className="cq-lg:hidden [&_img]:aspect-square [&_img]:h-auto [&_img]:w-full [&_img]:object-cover [&_img]:object-[80%_40%] cq-sm:[&_img]:aspect-[16/10] cq-sm:[&_img]:object-[74%_45%]">
              <MediaImage id={course.media.photo} sizes="(min-width: 640px) 92vw, 94vw" />
            </div>
            <div className="hidden cq-lg:absolute cq-lg:inset-0 cq-lg:block [&_img]:size-full [&_img]:object-cover [&_img]:object-[58%_62%]">
              <MediaImage id={course.media.photoTall} sizes="(min-width: 1280px) 600px, 50vw" />
            </div>
            <Float
              range={8}
              className="absolute bottom-3 left-3 w-[34%] max-w-[17rem] cq-sm:w-[40%] cq-sm:bottom-6 cq-sm:left-6"
            >
              <MediaImage
                id={course.media.device}
                sizes="(min-width: 1024px) 272px, 44vw"
                alt=""
                className="h-auto w-full drop-shadow-[0_22px_28px_oklch(0.3175_0.1094_256.25/30%)]"
              />
            </Float>
            <figcaption className="absolute top-3 right-3 rounded-pill bg-white/85 px-3 py-1 text-tiny text-subtle">
              {copy.illustrative}
            </figcaption>
          </figure>

          {/* Details */}
          <div className="relative grid min-w-0 content-center gap-5 p-6 cq-sm:p-10 cq-lg:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-4 right-4 hidden w-24 rotate-6 cq-md:block"
            >
              <MediaImage id={course.media.detail} sizes="96px" alt="" className="h-auto w-full" />
            </div>
            <Sparkle className="absolute top-8 right-32 hidden size-4 text-gold cq-md:block" />
            <Pill tone="lemon">{a.kicker}</Pill>
            <h2 id="recomendado-title" className="max-w-[20ch] text-[clamp(1.75rem,1.3rem+1.6vw,2.625rem)]">
              <Accent title={a.title} />
            </h2>
            <p className="max-w-[48ch] text-pretty">{a.lead}</p>

            <div className="grid gap-3 rounded-lg bg-sky/70 p-4">
              <h3 className="text-h3 font-extrabold text-ink">{course.name}</h3>
              <ul className="flex flex-wrap gap-2">
                {[course.audience, a.format].map((chip) => (
                  <li
                    key={chip}
                    className="rounded-pill bg-white px-3 py-1 text-tiny font-extrabold text-navy ring-1 ring-line"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-3">
              <p className="text-tiny font-extrabold tracking-[0.08em] text-subtle uppercase">
                {a.topicsLabel}
              </p>
              <ul className="grid grid-cols-1 gap-2.5">
                {course.topics.map((topic, index) => (
                  <li
                    key={topic}
                    data-reveal=""
                    style={{ "--i": index } as CSSProperties}
                    className="flex items-start gap-3 font-semibold text-ink"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.1em] grid size-6 shrink-0 place-items-center rounded-full bg-mint text-teal"
                    >
                      <Icon name="tick" size={15} strokeWidth={3} />
                    </span>
                    <span className="min-w-0">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="flex items-center gap-2 text-small font-bold text-navy">
              <Icon name="shield" size={18} className="shrink-0 text-teal" />
              {a.guaranteeBefore} {course.guaranteeDays} {a.guaranteeAfter}
            </p>

            <AffiliateLink
              href={affiliateHref(course)}
              product={course.slug}
              position="home"
              newTabLabel={a.newTab}
              className={`${LINK_NAVY} w-full cq-sm:w-fit`}
            >
              {a.cta}
            </AffiliateLink>

            <p
              data-affiliate-disclosure=""
              className="flex items-start gap-2 rounded-md bg-cream p-3 text-small text-pretty text-body ring-1 ring-line"
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
          </div>
        </article>
      </div>
    </section>
  );
}
