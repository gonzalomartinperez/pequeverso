"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
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
  "absolute inset-0 overflow-hidden rounded-[inherit] bg-card backface-hidden [-webkit-backface-visibility:hidden] [&_img]:size-full [&_img]:object-cover";
const FLIP_SECONDS = 0.56;
const FADE_SECONDS = 0.18;

/** Decodes every image of the card so the first turn never waits on a decode mid-flight. */
function decodeImages(root: HTMLElement): Promise<unknown> {
  return Promise.all([...root.querySelectorAll("img")].map((img) => img.decode().catch(() => undefined)));
}

/**
 * Two-faced preview that turns over in 3D: one inner element rotates on Y (gsap, 560 ms,
 * power2.inOut) inside a perspective parent with `preserve-3d`, both faces `backface-visibility:
 * hidden`. `will-change` is set only while turning; the shadow is a separate layer whose opacity
 * dips mid-turn (no box-shadow animation); images are decoded before the first turn. Under
 * reduced motion the faces crossfade instead. The hidden face is inert.
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
  const shadow = useRef<HTMLDivElement>(null);
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
    if (!el) return;
    const next = !flipped;
    const angle = next ? 180 : 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [gsap] = await Promise.all([loadGsap().catch(() => null), decodeImages(el)]);
    setFlipped(next);
    el.dataset.state = next ? "back" : "front";
    if (!gsap) {
      el.style.transform = `rotateY(${angle}deg)`;
      return;
    }
    gsap.killTweensOf([el, shadow.current]);
    if (reduced) {
      gsap
        .timeline()
        .to(el, { opacity: 0, duration: FADE_SECONDS, ease: "power1.out" })
        .set(el, { rotationY: angle })
        .to(el, { opacity: 1, duration: FADE_SECONDS, ease: "power1.in" });
      return;
    }
    el.style.willChange = "transform";
    gsap
      .timeline({
        onComplete: () => {
          el.style.willChange = "";
        },
      })
      .to(el, { rotationY: angle, duration: FLIP_SECONDS, ease: "power2.inOut" }, 0)
      .to(
        shadow.current,
        { opacity: 0.35, duration: FLIP_SECONDS / 2, ease: "power1.out", yoyo: true, repeat: 1 },
        0,
      );
  };

  return (
    <div data-slot="flip-preview" className={cx("grid justify-items-center gap-3", className)}>
      <div className={cx("relative w-full rounded-lg perspective-[1200px]", RATIO[ratio])}>
        <div ref={shadow} aria-hidden="true" className="absolute inset-0 rounded-[inherit] shadow-md" />
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
      </div>
      <button
        type="button"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        aria-expanded={flipped}
        aria-controls={id}
        onClick={() => void toggle()}
      >
        {flipped ? hideLabel : showLabel}
      </button>
    </div>
  );
}
