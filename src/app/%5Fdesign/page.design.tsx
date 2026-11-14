import type { Metadata } from "next";

/**
 * `/_design`: the state gallery (docs/design-system.md). This file is a route only when
 * `NEXT_PUBLIC_DESIGN_GALLERY=true` at build time (`design.tsx` is then a page extension, see
 * config/next.ts); otherwise Next ignores it and no route, chunk or string is emitted
 * (tools/check-design-gallery-disabled.ts). The folder is `%5Fdesign` because a plain `_design`
 * folder is private to the App Router. Never indexable, never in the sitemap.
 */
export const metadata: Metadata = {
  title: "Design state gallery",
  robots: { index: false, follow: false },
};

export { DesignGalleryView as default } from "@/views/design-gallery-view.tsx";
