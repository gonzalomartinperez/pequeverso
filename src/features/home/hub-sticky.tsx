import { affiliateHref, alimentacionBebe as course } from "@config/affiliates";
import { localCurrencyNoteShort } from "@config/commerce";
import { homeCopy as copy } from "@content/es/home";
import { hubCopy } from "@content/es/hub";
import type { ReactNode } from "react";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { buttonVariants } from "@/components/ui/button-variants";
import { AffiliateLink } from "@/features/commerce/AffiliateLink/AffiliateLink";
import { feeding, type HubNeed, reading } from "@/features/hub/hub-products";
import { cn } from "@/lib/utils";
import { NEED_TONE } from "./door";
import { price } from "./home-data";
import { ProductLink } from "./home-ui";
import { HubStickyBar } from "./hub-sticky-bar";

const ACTION = cn(
  buttonVariants({ variant: "secondary", size: "sm" }),
  "min-h-12 shrink-0 rounded-pill px-5 max-[25rem]:px-4 max-[25rem]:[&_svg]:hidden",
);

/**
 * Server half of the home's sticky bar: renders the three contents (doors, the kit, the course)
 * once on the server and hands them to the `HubStickyBar` island, which only picks one.
 */
export function HubSticky() {
  return (
    <HubStickyBar
      doors={
        <ul className="grid grid-cols-2 gap-[min(0.5rem,8px)]" role="list">
          {[reading, feeding].map((need) => (
            <li key={need.key} className="min-w-0">
              <a
                href={need.anchor}
                className="flex min-h-12 items-center gap-2 rounded-[1.5rem] bg-navy px-3 py-1.5 text-white no-underline transition-colors hover:bg-navy-deep hover:text-gold"
              >
                <Icon
                  name={NEED_TONE[need.key].icon}
                  size={18}
                  strokeWidth={2.4}
                  className="shrink-0 text-gold"
                />
                <span className="grid min-w-0 leading-tight">
                  <span className="text-small font-extrabold">{need.need}</span>
                  <span className="text-tiny text-white/80">{need.stage}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      }
      reading={
        <Row
          need={reading}
          title={reading.name}
          detail={`${price} · ${copy.reading.priceSuffix} · ${localCurrencyNoteShort}`}
        >
          <ProductLink position="sticky" className={ACTION}>
            {copy.reading.cta}
          </ProductLink>
        </Row>
      }
      feeding={
        <Row need={feeding} title={course.name} detail={hubCopy.feeding.disclosureTiny}>
          <AffiliateLink
            href={affiliateHref(course)}
            product={course.slug}
            position="sticky"
            newTabLabel={copy.affiliate.newTab}
            className={ACTION}
          >
            {hubCopy.feeding.go}
          </AffiliateLink>
        </Row>
      }
    />
  );
}

function Row({
  need,
  title,
  detail,
  children,
}: {
  need: HubNeed;
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-[min(0.625rem,10px)]">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-[44px] shrink-0 overflow-hidden rounded-md ring-1 ring-navy/10 max-[22.5rem]:hidden [&_img]:size-full [&_picture]:size-full",
          NEED_TONE[need.key].stage,
          need.recommended ? "[&_img]:object-contain [&_img]:object-bottom" : "[&_img]:object-cover",
        )}
      >
        <MediaImage id={need.thumb} sizes="44px" alt="" />
      </span>
      <span className="on-light grid min-w-0 grow basis-0 gap-0.5">
        <span className="truncate text-small leading-tight font-extrabold text-heading">{title}</span>
        <span className="text-tiny leading-tight text-pretty text-subtle">{detail}</span>
      </span>
      {children}
    </div>
  );
}
