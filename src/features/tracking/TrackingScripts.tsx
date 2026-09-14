"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { ScriptSpec, TrackingAdapter } from "@/features/tracking/adapters/types";
import { type ConsentState, hasConsent, onConsentChange, readConsent } from "@/features/tracking/consent";
import { enabledAdapters, trackingEnv } from "@/features/tracking/env";
import { isTrackingConfigured, syncConsent, trackPageView } from "@/features/tracking/track";

function shouldLoad(adapter: TrackingAdapter, consent: ConsentState | null): boolean {
  if (adapter.category === "none") return true;
  if (trackingEnv.consentMode === "advanced") return true;
  return hasConsent(adapter.category, consent);
}

function AdapterScript({ spec, onLoad }: { spec: ScriptSpec; onLoad: () => void }) {
  if (spec.src) {
    return (
      <Script id={spec.id} src={spec.src} strategy={spec.strategy} onLoad={onLoad} {...spec.attributes} />
    );
  }
  return (
    <Script id={spec.id} strategy={spec.strategy} {...spec.attributes}>
      {spec.inline ?? ""}
    </Script>
  );
}

/**
 * Injects each enabled adapter's scripts according to the consent mode: in `strict` mode a
 * gated adapter is injected only once its category is granted; in `advanced` mode Meta loads
 * immediately with consent revoked and is granted later. Fires PageView on the first load and
 * on every client-side navigation. Renders nothing without configuration.
 */
export function Analytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    return onConsentChange(setConsent);
  }, []);

  useEffect(() => {
    if (!isTrackingConfigured()) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackPageView();
  }, [pathname]);

  const scripts = enabledAdapters().flatMap((adapter) =>
    shouldLoad(adapter, consent) ? adapter.scripts(trackingEnv.consentMode) : [],
  );

  return (
    <>
      {scripts.map((spec) => (
        <AdapterScript key={spec.id} spec={spec} onLoad={syncConsent} />
      ))}
    </>
  );
}
