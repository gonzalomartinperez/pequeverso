# ADR-0017: Static starfield on phones; WebGL scene only on fine pointers after first interaction

Date: 2026-11-14 · Status: accepted (M3-2) · Related: owner decision D-03
(`docs/master-plan/README.md`), audit finding F-02, M3-1 trace
(`docs/verification/perf/2026-11-14-trace.md`)

## Context

F-02 measured the product page on a throttled phone profile with TBT 6.6 s and LCP 10.1 s. The M3-1
trace found the scene (three plus gsap, 155 to 250 KB of JavaScript, about 1.8 s of main-thread
self time at 4x CPU) loads after `load`, so it drives TBT and TTI rather than LCP. Parents browse in
in-app browsers on mid-range Android phones, where that cost is felt and the 3D effect (pointer
parallax, hover) adds little. The server-rendered `StaticStarfield` SVG already is the finished
resting layout of the scene.

## Decision

1. The page always renders the static layers (SVG starfield, CSS planets and orbit). They are the
   default and the only visual on phones.
2. The scene chunk is `import()`ed only when `(pointer: fine) and (min-width: 1024px)` matches, not
   under `prefers-reduced-motion`, Save-Data or a viewport under 650 px tall, and only after the first
   `pointerdown`, `keydown`, `scroll` or `wheel` (once, passive) plus an idle moment. The predicate
   (a `scroll` before the window `load` event, such as scroll restoration or a `#hash` jump, is
   not an interaction) and the interaction wait live in `src/shared/motion/scene/scene-gate.ts`; the media queries are
   listened to: a change tears down a live scene and waits for a new interaction before mounting
   again. An interaction before hydration is not seen; the next one recovers it.
3. The swap is unchanged: the canvas is absolutely positioned over the static layers and fades in
   (opacity only), so it adds no layout shift and the static layers are never the LCP element
   (the hero cutout image is).
4. The pause control (WCAG 2.2.2) is unchanged.

## Consequences

- Phones and narrow windows never request or parse the scene closure (about 177.6 KB, cap 250 KB):
  less JavaScript, less TBT. This task targets TBT and TTI; LCP is not expected to move (M3-1), the
  framework and the hero image decide it. LCP evidence comes from the CI production-config
  Lighthouse lane, recorded by the M3 lead.
- The pause toggle stays visible on phones: the CSS-driven `.pv-float` tiles and planets in the
  hero still move there and the toggle pauses them (WCAG 2.2.2).
- Desktop visitors who never interact never see the live scene; the static layers are the same
  composition, so this is invisible apart from the missing twinkle and parallax.
- The test `tests/browser/scene-gating.spec.ts` asserts that no scene chunk is requested on the
  390 px profile or before an interaction, and `tests/unit/scene-gate.test.ts` covers the predicate.

## Rollback

Revert the `sceneAllowed` call and `afterFirstInteraction` wait in
`src/shared/motion/scene/use-scene-runtime.ts` (restoring the `whenIdle(create)` start), or relax
`SCENE_MEDIA`. No data, URL or contract changes.
