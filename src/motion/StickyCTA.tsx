"use client";

import { type ReactNode, useEffect, useState } from "react";
import { below } from "@/lib/breakpoints";
import styles from "./StickyCTA.module.css";

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
      className={`${styles.bar} ${visible ? styles.visible : ""}`}
      inert={!visible}
      data-testid="sticky-cta"
    >
      <div className={styles.copy}>
        <span className={styles.label}>{label}</span>
        {note ? <span className={styles.note}>{note}</span> : null}
      </div>
      <div className={styles.action}>{children}</div>
    </div>
  );
}
