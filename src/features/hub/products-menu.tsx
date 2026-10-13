import { hubCopy } from "@content/es/hub";
import { ChevronDown } from "lucide-react";
import type { CSSProperties } from "react";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { type HubNeed, hubNeeds } from "./hub-products";
import { PopoverCloseLink } from "./popover-close-link";

const PANEL_ID = "pv-productos";

/**
 * Header «Productos» menu: a navy pill that opens a mega-menu panel with one rich card per need
 * (thumbnail, task, age, line, product and format; «Recomendado» on the affiliate course). Built
 * on the native Popover API: zero JavaScript to open, close on Escape or an outside click, focus
 * order right after the trigger, top layer (no z-index fights, no layout shift). The opening is a
 * CSS transition (`.pv-popover`, motion.css) and the cards rise with a short stagger; under
 * reduced motion it simply appears. Each card links to the need's chapter on the home
 * (`/#leer`, `/#bebe`), where the full facts and the affiliate disclosure sit next to the button.
 * Thumbnails are lazy: inside a closed popover they are never requested.
 */
export function ProductsMenu() {
  return (
    <>
      <button
        type="button"
        popoverTarget={PANEL_ID}
        data-slot="cta-button"
        data-products-trigger=""
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm" }),
          "pv-shine shrink-0 rounded-pill pr-4 pl-5 [&:has(+:popover-open)_[data-icon]]:rotate-180",
        )}
      >
        <span>{hubCopy.menu.label}</span>
        <ChevronDown
          aria-hidden="true"
          focusable="false"
          strokeWidth={2.6}
          data-icon="inline-end"
          className="size-[18px] transition-transform duration-(--duration) ease-out"
        />
      </button>
      <nav
        id={PANEL_ID}
        popover="auto"
        aria-label={hubCopy.menu.panelLabel}
        className="pv-popover on-light fixed inset-auto top-[calc(var(--header-height)+0.25rem)] left-1/2 m-0 max-h-[calc(100dvh-var(--header-height)-1rem)] w-[min(48rem,calc(100vw-1rem))] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-2xl border-0 bg-transparent p-0 text-ink"
      >
        <div className="relative overflow-hidden rounded-2xl bg-cream p-3 shadow-float ring-1 ring-navy/10 sm:p-4">
          <PanelSky />
          <div className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-2 pt-1 pb-3">
            <p className="font-display text-[1.375rem] leading-tight font-bold text-heading">
              {hubCopy.menu.title}
            </p>
            <p className="text-small text-subtle">{hubCopy.menu.hint}</p>
          </div>
          <ul className="relative grid grid-cols-1 gap-3 sm:grid-cols-2" role="list">
            {hubNeeds.map((need, index) => (
              <li key={need.key} data-menu-card="" style={{ "--i": index } as CSSProperties}>
                <MenuCard need={need} />
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}

/** One need as a large tappable card; the whole card is the link. */
function MenuCard({ need }: { need: HubNeed }) {
  const disclosure = need.recommended ? `${need.key}-menu-note` : undefined;
  return (
    <PopoverCloseLink
      href={`/${need.anchor}`}
      aria-describedby={disclosure}
      className="group/card relative grid h-full grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-4 rounded-xl bg-white p-3 text-ink no-underline shadow-sm ring-1 ring-line transition-[translate,box-shadow] duration-(--duration) ease-out hover:shadow-float hover:ring-teal/40 motion-safe:hover:-translate-y-1 sm:grid-cols-1 sm:items-start sm:p-4"
    >
      <span
        className={cn(
          "relative block aspect-square overflow-hidden rounded-lg sm:aspect-[16/10]",
          need.recommended
            ? "bg-[linear-gradient(160deg,var(--pv-peach),var(--pv-celeste))]"
            : "bg-[linear-gradient(160deg,var(--pv-celeste),var(--pv-white))]",
          "[&_img]:size-full [&_img]:transition-transform [&_img]:duration-500 [&_img]:ease-out motion-safe:group-hover/card:[&_img]:scale-[1.05]",
          need.recommended ? "[&_img]:object-contain [&_img]:object-bottom" : "[&_img]:object-cover",
        )}
      >
        <MediaImage id={need.thumb} sizes="(min-width: 640px) 360px, 88px" alt="" />
      </span>
      <span className="grid min-w-0 gap-1.5">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-pill bg-mint px-2.5 py-0.5 text-tiny font-extrabold text-teal-text">
            {need.stage}
          </span>
          {need.recommended ? (
            <span className="rounded-pill bg-lemon px-2.5 py-0.5 text-tiny font-extrabold text-ink">
              {hubCopy.feeding.recommended}
            </span>
          ) : null}
        </span>
        <span className="flex items-center justify-between gap-2 font-display text-[1.3rem] leading-tight font-bold text-heading">
          {need.need}
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-white transition-[rotate,background-color] duration-(--duration) ease-out group-hover/card:bg-teal motion-safe:group-hover/card:-rotate-45"
          >
            <Icon name="arrowDown" size={18} strokeWidth={2.6} className="-rotate-90" />
          </span>
        </span>
        <span className="text-small text-pretty text-body">{need.line}</span>
        <span className="text-tiny font-bold text-subtle">
          {need.name} · {need.format}
        </span>
        {need.recommended ? (
          <span id={disclosure} className="text-tiny text-pretty text-subtle">
            {hubCopy.feeding.disclosure}
          </span>
        ) : null}
      </span>
    </PopoverCloseLink>
  );
}

/** Two faint planets and a dotted orbit behind the cards (the small universe, decorative). */
function PanelSky() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-16 -right-10 size-48 rounded-full bg-[radial-gradient(closest-side,oklch(0.8521_0.0956_187.2/35%),transparent)]" />
      <div className="absolute -bottom-20 -left-12 size-56 rounded-full bg-[radial-gradient(closest-side,var(--pv-peach),transparent)]" />
      <div className="planet-gold absolute top-4 right-[38%] size-2.5 rounded-full" />
    </div>
  );
}
