"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackViewContent } from "@/lib/tracking";

export type OfferMode = "upsell" | "downsell";

export function readOfferMode(params: URLSearchParams | null): OfferMode {
  if (!params) return "upsell";
  return params.get("downsell") === "1" || params.get("offer") === "downsell" ? "downsell" : "upsell";
}

/**
 * After hydration, mirrors the offer mode chosen by the pre-paint script: keeps the
 * attribute consistent on client navigations, toggles aria-hidden on the inactive view
 * and records a ViewContent with the effective offer. Must be inside <Suspense>.
 */
export function OfferModeMirror({
  product,
  prices,
}: {
  product: string;
  prices: { upsell: number; downsell: number };
}) {
  const params = useSearchParams();
  const mode = readOfferMode(params);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-offer-root]");
    if (!root) return;
    root.setAttribute("data-offer", mode);
    for (const el of root.querySelectorAll<HTMLElement>(".only-upsell"))
      el.setAttribute("aria-hidden", mode === "downsell" ? "true" : "false");
    for (const el of root.querySelectorAll<HTMLElement>(".only-downsell"))
      el.setAttribute("aria-hidden", mode === "upsell" ? "true" : "false");
    trackViewContent({ product, name: `${product}-${mode}`, value: prices[mode], currency: "USD" });
  }, [mode, product, prices]);

  return null;
}
