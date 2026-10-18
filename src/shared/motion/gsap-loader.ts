import type { gsap as GsapInstance } from "gsap";

type Gsap = typeof GsapInstance;

let pending: Promise<Gsap> | null = null;

/**
 * Loads gsap once, on demand: a dynamic import in its own async chunk (shared with the 3D scene),
 * never part of a route's initial JavaScript. Callers warm it on intent (pointer/focus) or idle.
 */
export function loadGsap(): Promise<Gsap> {
  pending ??= import("gsap").then((module) => module.gsap);
  return pending;
}
