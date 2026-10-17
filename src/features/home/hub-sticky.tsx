import { affiliateHref, alimentacionBebe as course } from "@config/affiliates";
import { localCurrencyNoteShort } from "@config/commerce";
import { homeCopy as copy } from "@content/es/home";
import { hubCopy } from "@content/es/hub";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { MediaImage } from "@/components/blocks/media-image";
import { buttonVariants } from "@/components/ui/button-variants";
import { AffiliateLink } from "@/features/commerce/AffiliateLink/AffiliateLink";
import { HUB_CARD_LINK } from "@/features/hub/hub-link-styles";
import { HubProductLink } from "@/features/hub/hub-product-link";
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
        <div className="grid gap-2">
          <ul className="grid grid-cols-2 gap-[min(0.5rem,8px)]" role="list">
            {[reading, feeding].map((need) => (
              <li key={need.key} className="min-w-0">
                <HubProductLink
                  need={need}
                  position="sticky"
                  aria-describedby={need.recommended ? "hub-sticky-affiliate-note" : undefined}
                  className={`${HUB_CARD_LINK} flex h-full min-h-12 items-center justify-center rounded-[1.5rem] bg-navy px-[min(0.75rem,12px)] py-1.5 text-white no-underline transition-colors hover:bg-navy-deep hover:text-gold`}
                >
                  <span className="sr-only">{need.name}: </span>
                  <span className="min-w-0 text-center text-small leading-tight font-extrabold">
                    {need.go}
                    {need.recommended ? (
                      <ExternalLink
                        aria-hidden="true"
                        focusable="false"
                        size={14}
                        className="ml-1 inline align-baseline"
                      />
                    ) : null}
                  </span>
                </HubProductLink>
              </li>
            ))}
          </ul>
          <p id="hub-sticky-affiliate-note" className="text-tiny text-pretty text-body">
            {hubCopy.feeding.disclosure}
          </p>
        </div>
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
        <Row need={feeding} title={course.name} detail={hubCopy.feeding.disclosure}>
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
        <span className="text-tiny leading-tight text-pretty text-body">{detail}</span>
      </span>
      {children}
    </div>
  );
}
