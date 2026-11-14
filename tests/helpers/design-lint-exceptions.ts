// Frozen legacy findings: exact file + rule + values, with multiplicity, so any addition fails.
// The count per rule is also ratcheted (ratchets/design-lint.json, `legacy-exceptions:<rule>`) and
// may only fall. Retired by M4 (tokens) and M5 (design build); never extended.
export interface LegacyRule {
  reason: string;
  files: Record<string, string[]>;
}
export const LEGACY_EXCEPTIONS: Record<string, LegacyRule> = {
  "color-literal": {
    reason:
      "Legacy gradient, shadow or scene fallback literals; token migration belongs to M4 (tokens) and M5 (design build).",
    files: {
      "src/features/assistant/presentation/assistant.module.css": [
        "background: oklch(0.2619 0.0887 255.79 / 45%)",
      ],
      "src/features/commerce/presentation/hotmart-widget-slot.tsx": ["oklch(", "oklch(", "oklch("],
      "src/features/gallery/presentation/page-wall.module.css": [
        "mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      ],
      "src/features/gallery/presentation/video-player.tsx": ["oklch("],
      "src/features/hub/presentation/hub-sticky-bar.tsx": ["#bebe", "#bebe", "#bebe"],
      "src/features/hub/presentation/products-menu.tsx": ["oklch("],
      "src/features/playground/presentation/playground.module.css": [
        "--tile-edge: oklch(0.72 0.1 187)",
        "--tile-edge: oklch(0.78 0.15 88)",
        "--tile-edge: oklch(0.84 0.06 50)",
        "box-shadow: inset 0 1px 0 oklch(1 0 0 / 70%), 0 var(--tile-lift) 0 var(--tile-edge), 0 calc(var(--tile-lift) + 10px) 22px -8px oklch(0.3175 0.1094 256.25 / 32%)",
      ],
      "src/features/playground/presentation/syllable-playground.tsx": ["oklch(", "oklch("],
      "src/shared/motion/flip-preview.tsx": ["oklch("],
      "src/shared/motion/motion.css": [
        "background: linear-gradient(100deg, transparent 20%, oklch(1 0 0 / 28%) 45%, transparent 70%)",
        "background: radial-gradient( circle at var(--glare-x) var(--glare-y), oklch(1 0 0 / 28%), oklch(1 0 0 / 0%) 55% )",
        "border-color: oklch(1 0 0 / 100%)",
        "mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
      ],
      "src/shared/motion/scene/scene-runtime.ts": [
        "#00234e",
        "#007d79",
        "#ffd840",
        "#ffffff",
        "#ffffff",
      ],
      "src/shared/motion/tilt-card.tsx": ["oklch("],
      "src/shell/mobile-nav-sheet.tsx": ["oklch("],
      "src/shell/site-footer.tsx": [
        "#0000",
        "#ffd840",
        "#fff8",
        "#fffc",
        "oklch(",
        "oklch(",
        "oklch(",
      ],
      "src/views/home/door.tsx": ["oklch(", "oklch("],
      "src/views/home/feeding-chapter.tsx": ["#bebe"],
      "src/views/home/home-hero.tsx": ["#000", "oklch(", "oklch(", "oklch(", "oklch("],
      "src/views/home/product-story.tsx": ["oklch(", "oklch("],
      "src/views/not-found-view.tsx": ["#fff"],
      "src/views/product/core/final-offer.tsx": ["oklch(", "oklch(", "oklch("],
      "src/views/product/core/hero-composition.tsx": [
        "oklch(",
        "oklch(",
        "oklch(",
        "oklch(",
        "oklch(",
        "oklch(",
      ],
      "src/views/product/core/includes.tsx": ["oklch("],
      "src/views/product/core/playground-card.tsx": ["oklch("],
      "src/views/product/core/product-hero.tsx": ["oklch(", "oklch("],
      "src/views/product/core-landing-view.tsx": ["oklch("],
      "src/views/product/offer/offer-price.tsx": ["oklch("],
      "src/views/product/offer/pack-visual.tsx": ["oklch(", "oklch("],
      "src/views/product/thanks-view.tsx": ["oklch(", "oklch("],
    },
  },
  "spacing-radius": {
    reason: "Legacy arbitrary geometry; dimensions are preserved until the M5 design build.",
    files: {
      "src/features/commerce/presentation/sticky-cta.tsx": [
        "[&>*]:px-[20px]",
        "gap-[min(0.625rem,10px)]",
        "max-[25rem]:[&>*]:px-[16px]",
        "p-[min(0.5rem,8px)]",
      ],
      "src/features/gallery/presentation/page-wall.tsx": [
        "[&_img]:rounded-[12px]",
        "rounded-[18px]",
      ],
      "src/features/hub/presentation/hub-sticky-bar.tsx": ["p-[min(0.5rem,8px)]"],
      "src/features/landing/presentation/hero-stack.tsx": ["p-[clamp(3px,0.9cqw,6px)]"],
      "src/features/playground/presentation/playground-game.tsx": [
        "cq-sm:rounded-[26px]",
        "rounded-[22px]",
      ],
      "src/shared/editorial/icon-badge.tsx": ["rounded-[16px]"],
      "src/shared/ui/tooltip.tsx": ["rounded-[2px]"],
      "src/views/home/hub-sticky.tsx": [
        "gap-[min(0.5rem,8px)]",
        "gap-[min(0.625rem,10px)]",
        "px-[min(0.75rem,12px)]",
      ],
      "src/views/product/offer/pack-visual.tsx": ["rounded-t-[999px]"],
      "src/views/soporte-view.tsx": ["rounded-t-[999px]"],
    },
  },
  "transition-all": {
    reason:
      "Legacy motion (animates colour, layout and painted effects); behaviour is preserved until the M5 design build.",
    files: {
      "src/features/commerce/presentation/sticky-cta.tsx": ["transition-all"],
      "src/features/gallery/presentation/gallery-carousel.tsx": ["before:transition-all"],
      "src/features/playground/presentation/playground-game.tsx": ["transition-all"],
      "src/shell/site-header.tsx": ["transition-all"],
    },
  },
  coral: {
    reason:
      "Legacy decorative coral outside purchase surfaces; pixels are preserved until the M5 design build.",
    files: {
      "src/shared/editorial/eyebrow.tsx": ["coral", "coral"],
      "src/shared/editorial/icon-badge.tsx": ["coral", "text-coral-hover"],
      "src/shared/ui/badge-variants.ts": ["before:bg-coral", "text-coral-hover"],
      "src/views/home/home-ui.tsx": ["bg-coral"],
      "src/views/home/how-band.tsx": ["to-coral/15"],
      "src/views/product/offer/ui.tsx": ["border-coral/20"],
      "src/views/soporte-view.tsx": ["border-coral/15"],
    },
  },
  "animated-property": {
    reason:
      "Legacy motion beyond transform/opacity (control colours above 150 ms, layout, filter, shadow); preserved until the M5 design build.",
    files: {
      "src/app/globals.css": [
        "@keyframes pv-accordion-down: height: 0",
        "@keyframes pv-accordion-down: height: var(--accordion-panel-height)",
        "@keyframes pv-accordion-up: height: 0",
        "@keyframes pv-accordion-up: height: var(--accordion-panel-height)",
      ],
      "src/features/assistant/presentation/assistant.module.css": [
        "transition: bottom var(--duration) ease-out",
      ],
      "src/features/assistant/presentation/composer.tsx": ["transition-[border-color,box-shadow]"],
      "src/features/assistant/presentation/parts.tsx": ["transition-colors"],
      "src/features/gallery/presentation/gallery-carousel.tsx": ["transition", "transition"],
      "src/features/gallery/presentation/page-wall.module.css": [
        "transition: translate var(--duration) var(--pv-ease-out), rotate var(--duration) var(--pv-ease-out), box-shadow var(--duration) var(--pv-ease-out)",
        "transition: translate var(--duration) var(--pv-ease-out), rotate var(--duration) var(--pv-ease-out), box-shadow var(--duration) var(--pv-ease-out)",
        "transition: translate var(--duration) var(--pv-ease-out), rotate var(--duration) var(--pv-ease-out), box-shadow var(--duration) var(--pv-ease-out)",
      ],
      "src/features/gallery/presentation/video-block.tsx": ["transition"],
      "src/features/gallery/presentation/video-player.tsx": ["transition"],
      "src/features/gallery/presentation/zoom-dialog.tsx": ["transition", "transition"],
      "src/features/hub/presentation/hub-sticky-bar.tsx": [
        "transition-[translate,opacity,visibility]",
      ],
      "src/features/hub/presentation/products-menu.tsx": [
        "transition-[rotate,background-color]",
        "transition-[translate,box-shadow]",
      ],
      "src/features/landing/presentation/age-selector.tsx": [
        "transition-[background-color,border-color,color,box-shadow]",
        "transition-[background-color,border-color,color]",
      ],
      "src/features/landing/presentation/product-gallery.tsx": [
        "transition-[background-color,opacity]",
        "transition-[border-color,box-shadow,opacity]",
        "transition-[width,background-color]",
      ],
      "src/features/playground/presentation/playground-game.tsx": ["transition"],
      "src/features/playground/presentation/playground.module.css": [
        "transition: opacity 280ms var(--pv-ease-out) 760ms, scale 560ms cubic-bezier(0.3, 1.5, 0.5, 1) 760ms",
        "transition: opacity var(--duration) var(--pv-ease-out) 700ms, scale 420ms cubic-bezier(0.3, 1.6, 0.5, 1) 700ms",
        "transition: opacity var(--duration-reveal) var(--pv-ease-out) 600ms, translate var(--duration-reveal) var(--pv-ease-out) 600ms",
        "transition: rotate 700ms var(--pv-ease-emphasis) 250ms, scale 700ms var(--pv-ease-emphasis) 250ms",
        "transition: rotate 700ms var(--pv-ease-emphasis) 250ms, scale 700ms var(--pv-ease-emphasis) 250ms",
        "transition: stroke-dashoffset 700ms cubic-bezier(0.45, 0, 0.2, 1), fill-opacity 320ms var(--pv-ease-out) 420ms",
        "transition: stroke-dashoffset 700ms cubic-bezier(0.45, 0, 0.2, 1), fill-opacity 320ms var(--pv-ease-out) 420ms",
        "transition: translate 120ms var(--pv-ease-out), box-shadow 120ms var(--pv-ease-out), opacity var(--duration) var(--pv-ease-out)",
        "transition: translate 120ms var(--pv-ease-out), box-shadow 120ms var(--pv-ease-out), opacity var(--duration) var(--pv-ease-out)",
      ],
      "src/shared/editorial/faq.tsx": [
        "transition-[border-color,box-shadow,background-color]",
        "transition-[rotate,background-color,color]",
        "transition-[scale]",
      ],
      "src/shared/editorial/resource-grid.tsx": [
        "[&_img]:transition-[scale]",
        "transition-[transform,translate,box-shadow]",
      ],
      "src/shared/motion/flip-preview.tsx": ["after:transition", "transition", "transition"],
      "src/shared/motion/motion.css": [
        "@keyframes pv-float: translate: 0 0",
        "@keyframes pv-float: translate: 0 calc(-1 * var(--float-range, 12px))",
        "@keyframes pv-glow-spin: --glow-angle: 560deg",
        "@keyframes pv-header-condense: border-color: oklch(1 0 0 / 100%)",
        "@keyframes pv-header-condense: box-shadow: var(--pv-shadow-float)",
        "@keyframes pv-menu-in: translate: 0 10px",
        "@keyframes pv-orbit-travel: offset-distance: 100%",
        "@keyframes pv-reveal-blur: filter: blur(10px)",
        "@keyframes pv-reveal-blur: filter: none",
        "transition: height var(--duration) var(--pv-ease-out), content-visibility var(--duration) allow-discrete",
        "transition: height var(--duration) var(--pv-ease-out), content-visibility var(--duration) allow-discrete",
        "transition: opacity var(--duration) var(--pv-ease-out), scale var(--duration) var(--pv-ease-emphasis), overlay var(--duration) allow-discrete, display var(--duration) allow-discrete",
        "transition: opacity var(--duration) var(--pv-ease-out), scale var(--duration) var(--pv-ease-emphasis), overlay var(--duration) allow-discrete, display var(--duration) allow-discrete",
        "transition: opacity var(--duration) var(--pv-ease-out), scale var(--duration) var(--pv-ease-emphasis), overlay var(--duration) allow-discrete, display var(--duration) allow-discrete",
        "transition: translate 700ms var(--pv-ease-out)",
        "transition: translate var(--duration-hide, 340ms) var(--pv-ease-emphasis)",
      ],
      "src/shared/motion/scene/scene-stage.tsx": ["transition-[background-color,color]"],
      "src/shared/ui/accordion.tsx": [
        "transition-[border-color,box-shadow]",
        "transition-[height]",
        "transition-[rotate,background-color,color]",
        "transition-[scale]",
      ],
      "src/shared/ui/button-variants.ts": [
        "transition-[background,border-color,color,translate,box-shadow]",
      ],
      "src/shared/ui/card.tsx": ["transition-[translate,box-shadow]"],
      "src/shared/ui/radio-group.tsx": ["transition-[background-color,border-color,color]"],
      "src/shared/ui/tabs.tsx": ["transition-[background-color,border-color,color]"],
      "src/shell/mobile-nav-sheet.tsx": [
        "motion-safe:transition",
        "transition",
        "transition-[translate,box-shadow]",
        "transition-colors",
      ],
      "src/shell/site-footer.tsx": ["transition-colors"],
      "src/shell/site-header.tsx": ["transition", "transition-colors"],
      "src/shell/social-links.tsx": ["transition-[background-color,color,border-color,transform]"],
      "src/shell/withdrawal-strip.tsx": ["transition-colors"],
      "src/views/home/closing-band.tsx": ["transition-[translate,background-color]"],
      "src/views/home/door.tsx": ["transition-[translate,box-shadow]", "transition-colors"],
      "src/views/home/how-band.tsx": ["transition-[translate,background-color]"],
      "src/views/home/hub-sticky.tsx": ["transition-colors"],
      "src/views/product/offer/resource-bento.tsx": ["transition-shadow"],
    },
  },
};
