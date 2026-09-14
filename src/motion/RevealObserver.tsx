"use client";

import { useEffect } from "react";

const SCROLL_DRIVEN = "animation-timeline: view()";

/**
 * Fallback for browsers without view timelines: marks only [data-reveal] elements below the
 * fold as pending and reveals them once with IntersectionObserver. No-op when the CSS
 * scroll-driven path applies or under reduced motion.
 */
export function RevealObserver() {
  useEffect(() => {
    if (CSS.supports(SCROLL_DRIVEN)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    const fold = window.innerHeight;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal-state", "visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    for (const el of document.querySelectorAll("[data-reveal]:not([data-reveal-state])")) {
      if (el.getBoundingClientRect().top < fold) continue;
      el.setAttribute("data-reveal-state", "pending");
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
  return null;
}
