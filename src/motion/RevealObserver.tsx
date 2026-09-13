"use client";

import { useEffect } from "react";

/**
 * Progressive reveal-on-scroll. Marks <html class="js"> so CSS can hide [data-reveal]
 * elements only when JavaScript runs, then reveals them once (IntersectionObserver).
 * Reduced motion is handled in CSS (no transforms), so this stays purely additive.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    if (!("IntersectionObserver" in window)) {
      for (const el of document.querySelectorAll("[data-reveal]")) el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const observe = () => {
      for (const el of document.querySelectorAll("[data-reveal]:not(.is-visible)")) observer.observe(el);
    };
    observe();
    const mutation = new MutationObserver(observe);
    mutation.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);
  return null;
}
