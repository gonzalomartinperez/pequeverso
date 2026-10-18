import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const REVEAL = "[data-reveal]:not([data-reveal-state])";

/**
 * Scroll motion for browsers without CSS view timelines, on gsap ScrollTrigger: reveals the
 * [data-reveal] elements that start below the fold (marked `data-reveal-state`, hidden by
 * motion.css until they enter, batched and staggered) and drives the `Parallax` layers with a
 * scrubbed ±`--parallax-range`. Transform/opacity only; `gsap.matchMedia` drops everything when
 * reduced motion turns on. Returns the cleanup.
 */
export function mountFallbackMotion(): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const fold = window.innerHeight;
    const pending = [...document.querySelectorAll<HTMLElement>(REVEAL)].filter(
      (el) => el.getBoundingClientRect().top >= fold,
    );
    for (const el of pending) el.setAttribute("data-reveal-state", "pending");
    ScrollTrigger.batch(pending, {
      start: "top 92%",
      once: true,
      onEnter: (batch) => {
        for (const el of batch) el.setAttribute("data-reveal-state", "visible");
        gsap.fromTo(
          batch,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.48,
            ease: "power2.out",
            stagger: 0.06,
            clearProps: "opacity,transform",
          },
        );
      },
    });
    const range =
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--parallax-range")) ||
      20;
    for (const layer of document.querySelectorAll<HTMLElement>(".pv-parallax-layer")) {
      const sign = layer.dataset.direction === "down" ? -1 : 1;
      gsap.fromTo(
        layer,
        { y: sign * range },
        {
          y: -sign * range,
          ease: "none",
          scrollTrigger: {
            trigger: layer.parentElement ?? layer,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }
    return () => {
      for (const el of document.querySelectorAll("[data-reveal-state='pending']"))
        el.removeAttribute("data-reveal-state");
    };
  });
  return () => media.revert();
}
