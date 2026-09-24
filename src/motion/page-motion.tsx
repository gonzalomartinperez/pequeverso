"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

/** Sections that hold a `data-motion="none"` region (the Hotmart decision) never move. */
const SECTION = '[data-slot="section"]:not(:has([data-motion="none"]))';
const ENTRANCE_MS = 240;

/**
 * Section entrances with the Web Animations API: every `Section` that enters from below the
 * fold rises 8 px and settles (transform/opacity only, no fill mode, so nothing is ever left
 * hidden). Skipped entirely under reduced motion; running animations are cancelled when the
 * preference changes. Wraps the page's main content once (PageShell).
 */
export function PageMotion({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-observe the new route's sections after client navigation
  useEffect(() => {
    const root = container.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || preference.matches) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (preference.matches || entry.boundingClientRect.top <= 0) continue;
          const animation = entry.target.animate(
            [
              { opacity: 0.85, transform: "translateY(8px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: ENTRANCE_MS, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        }
      },
      { threshold: 0.05 },
    );
    const fold = window.innerHeight;
    for (const section of root.querySelectorAll(SECTION)) {
      if (section.getBoundingClientRect().top < fold) continue;
      observer.observe(section);
    }
    const cancel = () => {
      observer.disconnect();
      for (const animation of animations) animation.cancel();
      animations.clear();
    };
    preference.addEventListener("change", cancel);
    return () => {
      cancel();
      preference.removeEventListener("change", cancel);
    };
  }, [pathname]);

  return (
    <div ref={container} data-slot="page-motion" className="contents">
      {children}
    </div>
  );
}
