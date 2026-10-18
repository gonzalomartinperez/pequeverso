"use client";

import { type ReactNode, useEffect, useState } from "react";
import { below } from "@/shared/styles/breakpoints.ts";
import { cx } from "@/shared/styles/cx.ts";

type Mode = "hidden" | "doors" | "reading" | "feeding";

type Props = {
  /** Before the visitor is inside a chapter: the two direct product selections. */
  doors: ReactNode;
  /** Inside `#leer`: the kit, its price and the link to its page. */
  reading: ReactNode;
  /** Inside `#bebe`: the course, its disclosure and the affiliate link. */
  feeding: ReactNode;
};

/**
 * Zones that hide the bar while visible: the hero (doors already on screen), the syllable
 * playground (its tiles sit low on phones and must never be covered), the close and the footer.
 */
const COVER = ["#hero", '[data-slot="syllable-playground"]', "#cierre", "footer"];
/** Chapter zones: the one crossing the middle of the viewport decides the bar's content. */
const ZONES = [
  ["#leer", "reading"],
  ["#leer-como", "reading"],
  ["#bebe", "feeding"],
  ["#bebe-como", "feeding"],
] as const;
/** Header anchors highlighted (`aria-current="location"`) while their chapter is in the middle. */
const NAV = { reading: "#leer", feeding: "#bebe", faq: "#preguntas" } as const;

/**
 * The home's scroll companion, one small island for three behaviours (docs/specs/home-hub.md):
 *
 * 1. A contextual sticky bar below lg (floating glass pill like the landing's `StickyCTA`): the two
 *    doors before a chapter, the kit with its price inside `#leer`, the course with its disclosure
 *    inside `#bebe`; hidden over the hero, the playground, the close and the footer, and under open dialogs, so it
 *    never covers another control. Content swaps with a short rise (`.pv-swap`).
 * 2. The header slides away while reading down and returns on the way up (`data-hidden` on the
 *    header; CSS keeps it while it holds focus or its menu is open; transform only).
 * 3. The header anchor of the chapter in view is marked `aria-current="location"`.
 *
 * IntersectionObserver for zones and one passive, rAF-throttled scroll listener for direction: no
 * layout reads in the scroll path, nothing before hydration (the page is complete without it).
 */
export function HubStickyBar({ doors, reading, feeding }: Props) {
  const [mode, setMode] = useState<Mode>("hidden");

  useEffect(() => {
    const mobile = window.matchMedia(below("lg"));
    const header = document.querySelector<HTMLElement>('[data-slot="header"]');
    const covered = new Map<Element, boolean>();
    const inZone = new Map<Element, Mode>();
    let faq = false;

    const nav = (href: string) => header?.querySelector<HTMLAnchorElement>(`nav a[href="${href}"]`);
    const sync = () => {
      const zone = [...inZone.values()][0];
      for (const [key, href] of Object.entries(NAV)) {
        const active = key === "faq" ? faq && !zone : zone === key;
        const link = nav(href);
        if (active) link?.setAttribute("aria-current", "location");
        else link?.removeAttribute("aria-current");
      }
      if (!mobile.matches || [...covered.values()].some(Boolean)) setMode("hidden");
      else setMode(zone ?? "doors");
    };

    const coverObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) covered.set(entry.target, entry.isIntersecting);
        sync();
      },
      { threshold: 0.02 },
    );
    const zoneObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target.id === "preguntas") faq = entry.isIntersecting;
          else if (entry.isIntersecting)
            inZone.set(entry.target, entry.target.getAttribute("data-zone") as Mode);
          else inZone.delete(entry.target);
        }
        sync();
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const selector of COVER) {
      const target = document.querySelector(selector);
      if (target) coverObserver.observe(target);
    }
    for (const [selector, zone] of ZONES) {
      const target = document.querySelector(selector);
      if (!target) continue;
      target.setAttribute("data-zone", zone);
      zoneObserver.observe(target);
    }
    const questions = document.getElementById("preguntas");
    if (questions) zoneObserver.observe(questions);

    // Header direction: hide after reading down past the hero, show on any way up. An in-page
    // informational anchor jump (header links) keeps the header visible: the target lands right
    // under it (html scroll-padding) instead of under an empty band.
    let last = window.scrollY;
    let frame = 0;
    let hold = false;
    let idle = 0;
    const nativeScrollEnd = "onscrollend" in document;
    const releaseAnchor = () => {
      hold = false;
      clearTimeout(idle);
      last = window.scrollY;
    };
    const onScrollEnd = (event: Event) => {
      if (hold && event.target === document) releaseAnchor();
    };
    const onKeyScroll = (event: KeyboardEvent) => {
      if (
        ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key) &&
        !(event.target as Element | null)?.closest("input, textarea, select, [contenteditable]")
      )
        releaseAnchor();
    };
    const onAnchor = (event: MouseEvent) => {
      if (!(event.target as Element | null)?.closest?.('a[href^="#"], a[href^="/#"]')) return;
      header?.removeAttribute("data-hidden");
      clearTimeout(idle);
      hold = true;
    };
    const onScroll = () => {
      // Older browsers have no scrollend: release only after scrolling has gone quiet,
      // never a fixed interval after the click while the anchor is still moving.
      if (hold && !nativeScrollEnd) {
        clearTimeout(idle);
        idle = window.setTimeout(releaseAnchor, 1200);
      }
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (hold) {
          last = y;
          return;
        }
        if (Math.abs(y - last) < 8) return;
        const down = y > last && y > 320;
        if (down) header?.setAttribute("data-hidden", "");
        else header?.removeAttribute("data-hidden");
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    if (nativeScrollEnd) document.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("wheel", releaseAnchor, { passive: true });
    window.addEventListener("touchstart", releaseAnchor, { passive: true });
    document.addEventListener("keydown", onKeyScroll);
    document.addEventListener("click", onAnchor, true);
    mobile.addEventListener("change", sync);
    return () => {
      coverObserver.disconnect();
      zoneObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onAnchor, true);
      document.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("wheel", releaseAnchor);
      window.removeEventListener("touchstart", releaseAnchor);
      document.removeEventListener("keydown", onKeyScroll);
      clearTimeout(idle);
      mobile.removeEventListener("change", sync);
      cancelAnimationFrame(frame);
      header?.removeAttribute("data-hidden");
    };
  }, []);

  const visible = mode !== "hidden";
  const content = mode === "reading" ? reading : mode === "feeding" ? feeding : doors;
  return (
    <div
      data-slot="sticky-cta"
      data-testid="hub-sticky"
      data-mode={mode}
      data-visible={visible ? "" : undefined}
      inert={!visible}
      className={cx(
        "pv-sticky fixed inset-x-3 bottom-[calc(var(--space-3)+env(safe-area-inset-bottom))] z-60 mx-auto hidden max-w-xl rounded-[2rem] bg-white p-[min(0.5rem,8px)] shadow-float ring-1 ring-navy/12 transition-[translate,opacity,visibility] duration-(--duration) ease-emphasis max-lg:block",
        "[body:has(dialog[open],[role=dialog][data-open])_&]:invisible [body:has(dialog[open],[role=dialog][data-open])_&]:translate-y-[calc(100%+2rem)] [body:has(dialog[open],[role=dialog][data-open])_&]:opacity-0",
        visible ? "visible translate-y-0 opacity-100" : "invisible translate-y-[calc(100%+2rem)] opacity-0",
      )}
    >
      <div key={mode === "hidden" ? "doors" : mode} className="pv-swap">
        {content}
      </div>
    </div>
  );
}
