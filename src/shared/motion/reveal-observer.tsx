"use client";

import { useEffect } from "react";

const SCROLL_DRIVEN = "animation-timeline: view()";
const ANIMATED = "[data-reveal], .pv-parallax-layer";

/** Runs `callback` once the main thread is idle; returns a canceller. */
function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 200);
  return () => window.clearTimeout(id);
}

/**
 * Fallback for browsers without view timelines (e.g. Firefox): after idle it lazily imports
 * `fallback-motion` (gsap + ScrollTrigger, never in the initial bundle) to reveal below-the-fold
 * [data-reveal] elements and drive the parallax layers. No-op when the CSS scroll-driven path
 * applies, under reduced motion, or on pages with nothing to animate.
 */
export function RevealObserver() {
  useEffect(() => {
    if (CSS.supports(SCROLL_DRIVEN)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!document.querySelector(ANIMATED)) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    const cancelIdle = whenIdle(() => {
      void import("./fallback-motion").then(({ mountFallbackMotion }) => {
        if (!cancelled) dispose = mountFallbackMotion();
      });
    });
    return () => {
      cancelled = true;
      cancelIdle();
      dispose?.();
    };
  }, []);
  return null;
}
