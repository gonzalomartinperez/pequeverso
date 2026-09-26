"use client";

import { RotateCw } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { loadGsap } from "./gsap-loader";

type Props = {
  front: ReactNode;
  back: ReactNode;
  /** Accessible label of the toggle while the front is shown. */
  showLabel?: string | undefined;
  /** Accessible label of the toggle while the back is shown. */
  hideLabel?: string | undefined;
  ratio?: "4/3" | "3/4" | "16/9" | undefined;
  className?: string | undefined;
};

const RATIO = { "4/3": "aspect-[4/3]", "3/4": "aspect-[3/4]", "16/9": "aspect-video" } as const;
/** Both faces hide their back side (prefixed for Safari); the back one is pre-rotated 180°. */
const FACE =
  "absolute inset-0 overflow-hidden rounded-[inherit] border-[5px] border-white bg-card backface-hidden [-webkit-backface-visibility:hidden] [&_img]:size-full [&_img]:object-cover";
const LIFT_SECONDS = 0.14;
const FLIP_SECONDS = 0.6;
const SETTLE_SECONDS = 0.2;
const FADE_SECONDS = 0.18;

/** Decodes every image of the card so the first turn never waits on a decode mid-flight. */
function decodeImages(root: HTMLElement): Promise<unknown> {
  return Promise.all([...root.querySelectorAll("img")].map((img) => img.decode().catch(() => undefined)));
}

/**
 * Two-faced preview that turns over in 3D with one gsap timeline on the inner card: a slight lift
 * (scale 1.02, z 24 px), the 180° rotateY (600 ms, power2.inOut) and a settle, inside a
 * perspective parent with `preserve-3d`; both faces `backface-visibility: hidden` (+ `-webkit-`).
 * `will-change` only while turning, input ignored until the timeline ends, the shadow is a
 * pseudo-element whose opacity (`--flip-shadow`) dips mid-turn (no box-shadow animation), images
 * are decoded before the first turn. Reduced motion crossfades. The hidden face is inert.
 */
export function FlipPreview({
  front,
  back,
  showLabel = "Ver el reverso",
  hideLabel = "Ver el frente",
  ratio = "4/3",
  className,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const id = useId();

  // Warm gsap when the card nears the viewport, so the first turn never waits on the chunk.
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        void loadGsap().catch(() => undefined);
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggle = async () => {
    const el = card.current;
    const stage = wrapper.current;
    if (!el || !stage || busy.current) return;
    busy.current = true;
    const next = !flipped;
    const angle = next ? 180 : 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [gsap] = await Promise.all([loadGsap().catch(() => null), decodeImages(el)]);
    setFlipped(next);
    el.dataset.state = next ? "back" : "front";
    const done = () => {
      el.style.willChange = "";
      busy.current = false;
    };
    if (!gsap) {
      el.style.transform = `rotateY(${angle}deg)`;
      done();
      return;
    }
    gsap.killTweensOf([el, stage]);
    if (reduced) {
      gsap
        .timeline({ onComplete: done })
        .to(el, { opacity: 0, duration: FADE_SECONDS, ease: "power1.out" })
        .set(el, { rotationY: angle })
        .to(el, { opacity: 1, duration: FADE_SECONDS, ease: "power1.in" });
      return;
    }
    el.style.willChange = "transform";
    // Lift → turn → settle; the shadow (a pseudo-element) fades through --flip-shadow meanwhile.
    gsap
      .timeline({ onComplete: done })
      .to(el, { scale: 1.02, z: 24, duration: LIFT_SECONDS, ease: "power1.out" }, 0)
      .to(stage, { "--flip-shadow": 0.4, duration: FLIP_SECONDS / 2, ease: "power1.out" }, 0)
      .to(el, { rotationY: angle, duration: FLIP_SECONDS, ease: "power2.inOut" }, LIFT_SECONDS / 2)
      .to(el, { scale: 1, z: 0, duration: SETTLE_SECONDS, ease: "power2.out" }, `>-${SETTLE_SECONDS / 2}`)
      .to(stage, { "--flip-shadow": 1, duration: FLIP_SECONDS / 2, ease: "power1.in" }, "<");
  };

  return (
    <div data-slot="flip-preview" className={cx("grid justify-items-center gap-3", className)}>
      <div
        ref={wrapper}
        className={cx(
          "group/flip relative isolate w-full rounded-lg perspective-[1200px] transition duration-(--duration-reveal) ease-emphasis [--flip-shadow:1] after:absolute after:inset-0 after:-z-1 after:rounded-[inherit] after:opacity-(--flip-shadow) after:shadow-float motion-safe:hover:-translate-y-1.5",
          RATIO[ratio],
        )}
      >
        <div
          ref={card}
          id={id}
          data-state="front"
          className="relative size-full rounded-[inherit] transform-3d [-webkit-transform-style:preserve-3d]"
        >
          <div className={FACE} inert={flipped} aria-hidden={flipped}>
            {front}
          </div>
          <div className={cx(FACE, "rotate-y-180")} inert={!flipped} aria-hidden={!flipped}>
            {back}
          </div>
        </div>
        {/* Sheen that sweeps across the paper on hover (fine pointers, motion allowed). */}
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] after:absolute after:inset-y-0 after:-left-1/2 after:w-1/2 after:bg-[linear-gradient(100deg,transparent,oklch(1_0_0/45%),transparent)] after:opacity-0 after:transition after:duration-700 after:ease-out motion-safe:group-hover/flip:after:translate-x-[300%] motion-safe:group-hover/flip:after:opacity-100"
          aria-hidden="true"
        />
      </div>
      <button
        type="button"
        className="glass inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill px-4 text-small font-extrabold text-navy shadow-sm transition duration-(--duration-fast) ease-out hover:bg-white active:scale-97"
        aria-expanded={flipped}
        aria-controls={id}
        onClick={() => void toggle()}
      >
        <RotateCw
          className={cx(
            "size-4 text-teal transition-transform duration-(--duration-reveal) ease-emphasis",
            flipped && "rotate-180",
          )}
          aria-hidden="true"
        />
        {flipped ? hideLabel : showLabel}
      </button>
    </div>
  );
}
