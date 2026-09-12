"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { hasMarketingConsent, onConsentChange } from "@/lib/consent";
import { flush, isTrackingConfigured, PIXEL_ID, trackPageView } from "@/lib/tracking";

const UMAMI_SCRIPT = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "";
const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "";

/**
 * Loads the Meta Pixel only after marketing consent, fires PageView on the first load
 * and on every client-side navigation, and flushes queued events. Optional cookie-less
 * Umami loads without consent (it sets no cookies; documented in /cookies/).
 * Renders nothing when no integration is configured, so public clones stay clean.
 */
export function Analytics() {
  const pathname = usePathname();
  const [consented, setConsented] = useState(false);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    setConsented(hasMarketingConsent());
    return onConsentChange((state) => setConsented(state?.marketing === true));
  }, []);

  useEffect(() => {
    if (!isTrackingConfigured()) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackPageView();
  }, [pathname]);

  const loadPixel = isTrackingConfigured() && consented;

  return (
    <>
      {loadPixel ? (
        <Script
          id="meta-pixel"
          src="https://connect.facebook.net/en_US/fbevents.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (typeof window.fbq !== "function") return;
            window.fbq("init", PIXEL_ID);
            flush();
          }}
        />
      ) : null}
      {loadPixel ? (
        <Script id="meta-pixel-bootstrap" strategy="afterInteractive">
          {`window.fbq=window.fbq||function(){(window.fbq.queue=window.fbq.queue||[]).push(arguments)};window._fbq=window._fbq||window.fbq;window.fbq.loaded=true;window.fbq.version='2.0';`}
        </Script>
      ) : null}
      {UMAMI_SCRIPT && UMAMI_ID ? (
        <Script id="umami" src={UMAMI_SCRIPT} data-website-id={UMAMI_ID} strategy="lazyOnload" defer />
      ) : null}
    </>
  );
}
