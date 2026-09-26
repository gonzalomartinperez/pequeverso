"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Share of the wall (or of the viewport it fills) that must be on screen for it to drift. */
const DRIFT_SHARE = 0.5;

/**
 * Freezes a drifting track where it is: the current transform goes inline and the negative delay
 * that resumes the loop from the same point is stored for later. No-op without a running drift
 * (reduced motion, or already frozen).
 */
function freeze(track: HTMLElement): void {
  const drift = track.getAnimations?.()[0];
  if (!drift) return;
  const { duration, delay = 0 } = drift.effect?.getComputedTiming() ?? {};
  const period = Number(duration);
  const elapsed = Number(drift.currentTime ?? 0) - delay;
  const transform = getComputedStyle(track).transform;
  track.style.transform = transform === "none" ? "" : transform;
  if (period > 0) track.style.animationDelay = `${-(((elapsed % period) + period) % period)}ms`;
}

/** Lets a frozen track drift again from the position it was frozen at. */
function thaw(track: HTMLElement): void {
  track.style.removeProperty("transform");
}

/**
 * Pause/resume control of the enclosing `PageWall` (WCAG 2.2.2); hidden under reduced motion. It
 * also keeps the drift running only while the wall is mostly on screen: an idle wall has its
 * animation removed (not paused), which is what actually spares the renderer.
 */
export function WallToggle() {
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const ref = useRef<HTMLButtonElement>(null);

  // Pages slide in from off-screen, where native lazy loading never starts them: once the wall
  // nears the viewport, promote every page on it to eager so none enters the view blank.
  useEffect(() => {
    const wall = ref.current?.closest<HTMLElement>("[data-slot='page-wall']");
    if (!wall) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        for (const img of wall.querySelectorAll<HTMLImageElement>("img[loading='lazy']"))
          img.loading = "eager";
        observer.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(wall);
    return () => observer.disconnect();
  }, []);

  // Drift only while at least half the wall is visible (or it fills half the viewport). Below the
  // fold, or with only its edge showing above the gallery, the loop is invisible motion that
  // still costs a repaint of every page on each frame where the browser cannot composite it.
  useEffect(() => {
    const wall = ref.current?.closest<HTMLElement>("[data-slot='page-wall']");
    if (!wall) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        const viewport = entry.rootBounds?.height ?? window.innerHeight;
        setOnScreen(
          entry.intersectionRatio >= DRIFT_SHARE - 0.01 ||
            entry.intersectionRect.height >= viewport * DRIFT_SHARE,
        );
      },
      { threshold: [0, 0.25, DRIFT_SHARE, 0.75, 1] },
    );
    observer.observe(wall);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const wall = ref.current?.closest<HTMLElement>("[data-slot='page-wall']");
    if (!wall) return;
    const idle = paused || !onScreen;
    const tracks = wall.querySelectorAll<HTMLElement>("[data-slot='page-wall-track']");
    if (idle) for (const track of tracks) freeze(track);
    wall.toggleAttribute("data-idle", idle);
    if (!idle) for (const track of tracks) thaw(track);
  }, [paused, onScreen]);

  return (
    <button
      ref={ref}
      type="button"
      data-slot="page-wall-toggle"
      aria-pressed={paused}
      aria-label={paused ? "Reanudar el desplazamiento" : "Pausar el desplazamiento"}
      className="glass absolute right-3 bottom-3 z-1 grid size-11 cursor-pointer place-items-center rounded-full text-navy shadow-md transition-transform duration-(--duration-fast) ease-out hover:scale-105 motion-reduce:hidden sm:right-5 sm:bottom-5"
      onClick={(event) => {
        const wall = event.currentTarget.closest<HTMLElement>("[data-slot='page-wall']");
        const next = !paused;
        wall?.toggleAttribute("data-paused", next);
        setPaused(next);
      }}
    >
      {paused ? (
        <PlayIcon className="size-4.5" fill="currentColor" aria-hidden="true" />
      ) : (
        <PauseIcon className="size-4.5" fill="currentColor" aria-hidden="true" />
      )}
    </button>
  );
}
