import { affiliateHref, alimentacionBebe as course } from "@config/affiliates";
import { localCurrencyNoteShort } from "@config/commerce";
import { homeCopy as copy } from "@content/es/home";
import { hubCopy } from "@content/es/hub";
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { Section } from "@/components/blocks/section";
import { SocialLinks } from "@/components/blocks/social-links";
import { AffiliateLink } from "@/features/commerce/AffiliateLink/AffiliateLink";
import { feeding, type HubNeed, reading } from "@/features/hub/hub-products";
import { cn } from "@/lib/utils";
import { Float } from "@/motion/float";
import { Universe } from "@/motion/universe";
import { NEED_TONE } from "./door";
import { price } from "./home-data";
import { Accent, LINK_WHITE, Pill, ProductLink } from "./home-ui";

/**
 * Closing band (`#cierre`): the navy universe with the two doors again, now pointing straight to
 * each destination with the same white pill: the kit's product page (with its price) and the
 * course's affiliate redirect (with its disclosure). The syllable cards and the food planet float
 * on either side (decorative). Social profiles close the page before the footer.
 */
export function ClosingBand() {
  const c = copy.closing;
  return (
    <Section
      id="cierre"
      tone="navy"
      labelledBy="cierre-title"
      divider="arc"
      backdrop={<Universe variant="band" />}
      className="cq"
      defer
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Float range={12} className="absolute top-[4%] -left-[6%] hidden w-[22rem] opacity-90 cq-lg:block">
          <MediaImage id="gf.cutout.elementos" sizes="352px" alt="" className="h-auto w-full" />
        </Float>
        <Float delay={3} range={12} className="absolute top-[6%] -right-[4%] hidden w-[17rem] cq-lg:block">
          <MediaImage id={course.media.planet} sizes="272px" alt="" className="h-auto w-full" />
        </Float>
      </div>
      <div className="relative grid justify-items-center gap-5 text-center">
        <Pill tone="gold">{c.kicker}</Pill>
        <h2 id="cierre-title" className="max-w-[18ch]">
          <Accent title={c.title} tone="dark" />
        </h2>
        <p className="lead max-w-[44ch] text-pretty">{c.text}</p>
        <ul
          className="mt-4 grid w-full max-w-[60rem] grid-cols-1 gap-4 text-start cq-md:grid-cols-2 cq-md:gap-6"
          role="list"
        >
          <li data-reveal="" style={{ "--i": 0 } as CSSProperties}>
            <ClosingDoor
              need={reading}
              note={`${price} · ${copy.reading.priceSuffix} · ${localCurrencyNoteShort}`}
            >
              <ProductLink position="closing" className={`${LINK_WHITE} w-full`}>
                {c.readingCta}
              </ProductLink>
            </ClosingDoor>
          </li>
          <li data-reveal="" style={{ "--i": 1 } as CSSProperties}>
            <ClosingDoor need={feeding} note={hubCopy.feeding.disclosure}>
              <AffiliateLink
                href={affiliateHref(course)}
                product={course.slug}
                position="closing"
                newTabLabel={copy.affiliate.newTab}
                className={`${LINK_WHITE} w-full`}
              >
                {c.feedingCta}
              </AffiliateLink>
            </ClosingDoor>
          </li>
        </ul>
        <div className="mt-8 grid w-full justify-items-center gap-3 border-t border-white/15 pt-7">
          <p className="text-small">{c.social}</p>
          <SocialLinks tone="dark" />
        </div>
      </div>
    </Section>
  );
}

function ClosingDoor({ need, note, children }: { need: HubNeed; note: string; children: ReactNode }) {
  const tone = NEED_TONE[need.key];
  return (
    <div
      data-closing-door={need.key}
      className="glass-dark grid h-full content-between gap-5 rounded-xl p-5 ring-1 ring-white/12 transition-[translate,background-color] duration-(--duration) ease-out hover:bg-white/12 motion-safe:hover:-translate-y-1 cq-sm:p-7"
    >
      <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-4">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-16 place-items-center overflow-hidden rounded-lg",
            tone.stage,
            "[&_img]:size-full",
            need.recommended ? "[&_img]:object-contain [&_img]:object-bottom" : "[&_img]:object-cover",
          )}
        >
          <MediaImage id={need.thumb} sizes="64px" alt="" />
        </span>
        <span className="grid gap-1">
          <span className="flex flex-wrap items-center gap-2 text-tiny font-extrabold text-gold">
            <Icon name={tone.icon} size={14} strokeWidth={2.6} />
            {need.stage}
            {need.recommended ? <span className="text-white/80">· {hubCopy.feeding.recommended}</span> : null}
          </span>
          <span className="font-display text-[1.6rem] leading-tight font-bold text-white">{need.need}</span>
          <span className="text-small text-body">
            {need.name} · {need.format}
          </span>
        </span>
      </div>
      <div className="grid gap-2">
        {children}
        <p className="text-tiny text-pretty text-body">{note}</p>
      </div>
    </div>
  );
}
