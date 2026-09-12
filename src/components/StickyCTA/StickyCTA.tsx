"use client";

import { type ReactNode, useEffect, useState } from "react";
import styles from "./StickyCTA.module.css";

type Props = {
  /** Selectors of elements that hide the bar while they are visible (hero, final offer, footer). */
  hideWhenVisible: string[];
  label: string;
  children: ReactNode;
};

/**
 * Mobile-only sticky purchase bar. Appears after the hero leaves the viewport and hides
 * over the final offer and footer so it never covers another CTA (WCAG 2.4.11).
 */
export function StickyCTA({ hideWhenVisible, label, children }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = hideWhenVisible
      .map((selector) => document.querySelector(selector))
      .filter(Boolean) as Element[];
    if (targets.length === 0) return;
    const state = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) state.set(entry.target, entry.isIntersecting);
        setVisible(![...state.values()].some(Boolean));
      },
      { threshold: 0.05 },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [hideWhenVisible]);

  return (
    <div
      className={`${styles.bar} ${visible ? styles.visible : ""}`}
      inert={!visible}
      data-testid="sticky-cta"
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.action}>{children}</div>
    </div>
  );
}
