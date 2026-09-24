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
  children: ReactNode;
};

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
 * Mobile-only sticky purchase bar. Appears after the hero leaves the viewport, hides over the
 * final offer, the footer and any open dialog so it never covers another control (WCAG 2.4.11).
 */
export function StickyCTA({ hideWhenVisible, label, note, children }: Props) {
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
        "fixed inset-x-0 bottom-0 z-60 hidden items-center justify-between gap-3 border-t border-border bg-surface-veil px-(--gutter) pt-2 pb-[calc(var(--space-2)+env(safe-area-inset-bottom))] shadow-lg transition-[translate,visibility] duration-(--duration) ease-out max-lg:flex [body:has(dialog[open],[role=dialog][data-open])_&]:invisible [body:has(dialog[open],[role=dialog][data-open])_&]:translate-y-[110%]",
        // Hidden means off-screen *and* invisible, so full-page captures never show it over content.
        visible ? "visible translate-y-0" : "invisible translate-y-[110%]",
      )}
    >
      <div className="grid min-w-0 gap-0.5">
        <span className="text-small leading-tight font-extrabold text-heading">{label}</span>
        {note ? <span className="text-tiny leading-tight text-subtle">{note}</span> : null}
      </div>
      <div className="shrink-0 [&>*]:min-h-13 [&>*]:px-6 [&>*]:whitespace-nowrap">{children}</div>
    </div>
  );
}
