"use client";

import { type ReactNode, useEffect, useState } from "react";
import { below } from "@/lib/breakpoints";
import { cx } from "@/lib/cx";

type Props = {
  /** Selectors of elements that hide the bar while they are visible (hero, final offer, footer). */
  hideWhenVisible: string[];
  label: string;
  /** Small second line under the label (e.g. the local-currency note). */
  note?: string;
  /**
   * Product thumbnail (server-rendered, e.g. `<MediaImage id="gf.card.01" … />`), shown in a
   * 44 px tile. Without it the tile shows the brand's gold star on the navy sky.
   */
  thumb?: ReactNode;
  children: ReactNode;
};

/** "Kit completo · US$14,99" → name and price on their own lines (price in the purchase colour). */
function splitPrice(label: string): { name: string; price?: string } {
  const at = label.lastIndexOf(" · ");
  const tail = at > 0 ? label.slice(at + 3) : "";
  return /US\$/.test(tail) ? { name: label.slice(0, at), price: tail } : { name: label };
}

const STAR = "M0-9 L2.6-2.8 9.2-2.8 3.9 1.1 5.9 7.5 0 3.7 -5.9 7.5 -3.9 1.1 -9.2-2.8 -2.6-2.8 Z";

function BrandTile() {
  return (
    <svg viewBox="-12 -12 24 24" className="size-full" aria-hidden="true" focusable="false">
      <path d={STAR} className="fill-gold" />
    </svg>
  );
}

function observeTargets(selectors: string[], onChange: (covered: boolean) => void) {
  const targets = selectors.map((selector) => document.querySelector(selector)).filter(Boolean) as Element[];
  if (targets.length === 0) return undefined;
  const state = new Map<Element, boolean>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) state.set(entry.target, entry.isIntersecting);
      onChange([...state.values()].some(Boolean));
    },
    { threshold: 0.05 },
  );
  for (const target of targets) observer.observe(target);
  return observer;
}

/**
 * Mobile-only sticky purchase pill (floating glass). Appears after the hero leaves the viewport, hides over the
 * final offer, the footer and any open dialog so it never covers another control (WCAG 2.4.11).
 */
export function StickyCTA({ hideWhenVisible, label, note, thumb, children }: Props) {
  const { name, price } = splitPrice(label);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia(below("lg"));
    let observer: IntersectionObserver | undefined;
    const sync = () => {
      observer?.disconnect();
      observer = undefined;
      if (!mobile.matches) {
        setVisible(false);
        return;
      }
      observer = observeTargets(hideWhenVisible, (covered) => setVisible(!covered));
    };
    sync();
    mobile.addEventListener("change", sync);
    return () => {
      observer?.disconnect();
      mobile.removeEventListener("change", sync);
    };
  }, [hideWhenVisible]);

  return (
    <div
      data-slot="sticky-cta"
      data-testid="sticky-cta"
      data-visible={visible ? "" : undefined}
      inert={!visible}
      className={cx(
        // Floating glass pill, centred and capped on tablets; the safe area lifts it on notched phones.
        "glass fixed inset-x-3 bottom-[calc(var(--space-3)+env(safe-area-inset-bottom))] z-60 mx-auto hidden max-w-xl items-center gap-2.5 rounded-pill py-2 pr-2 pl-2 shadow-float ring-1 ring-navy/10 transition-all duration-(--duration) ease-emphasis max-lg:flex",
        "[body:has(dialog[open],[role=dialog][data-open])_&]:invisible [body:has(dialog[open],[role=dialog][data-open])_&]:translate-y-[calc(100%+2rem)] [body:has(dialog[open],[role=dialog][data-open])_&]:opacity-0",
        // Hidden means off-screen *and* invisible, so full-page captures never show it over content.
        visible ? "visible translate-y-0 opacity-100" : "invisible translate-y-[calc(100%+2rem)] opacity-0",
      )}
    >
      <div
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md bg-navy p-2.5 shadow-sm ring-1 ring-navy/10 max-[22.5rem]:hidden [&:has(img)]:bg-white [&:has(img)]:p-0 [&_img]:size-full [&_img]:object-cover [&_picture]:size-full"
      >
        {thumb ?? <BrandTile />}
      </div>
      <div className="on-light mr-auto grid min-w-0 gap-0.5">
        <span className="truncate text-small leading-tight font-extrabold text-heading">
          {name}
          {price ? <span className="sr-only"> · </span> : null}
        </span>
        {price ? (
          <span className="flex min-w-0 items-baseline gap-1.5 leading-tight">
            <span className="font-display text-[1.0625rem] font-bold text-primary tabular-nums">{price}</span>
            {note ? <span className="truncate text-tiny text-subtle max-[25rem]:hidden">{note}</span> : null}
          </span>
        ) : note ? (
          <span className="truncate text-tiny leading-tight text-subtle">{note}</span>
        ) : null}
      </div>
      <div className="shrink-0 [&>*]:min-h-12 [&>*]:rounded-pill [&>*]:px-5 [&>*]:whitespace-nowrap max-[25rem]:[&>*]:px-4 max-[25rem]:[&_svg]:hidden">
        {children}
      </div>
    </div>
  );
}
