"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { ScriptSpec } from "@/features/tracking/adapters/types";
import { type ConsentState, hasConsent, onConsentChange, readConsent } from "@/features/tracking/consent";
import { enabledAdapters } from "@/features/tracking/env";
import { isTrackingConfigured, syncConsent, trackPageView } from "@/features/tracking/track";

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
 * Injects each enabled adapter's scripts once the stored choice has been read on the client:
 * allowed by default, never for a category the visitor rejected. A rejection after load is
 * handled by the adapter's `onConsent` (vendor revoke). Fires PageView on the first load and on
 * every client-side navigation. Renders nothing without configuration.
 */
export function Analytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState | null | undefined>(undefined);
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

  if (consent === undefined) return null;

  const scripts = enabledAdapters().flatMap((adapter) =>
    hasConsent(adapter.category, consent) ? adapter.scripts() : [],
  );

  return (
    <>
      {scripts.map((spec) => (
        <AdapterScript key={spec.id} spec={spec} onLoad={syncConsent} />
      ))}
    </>
  );
}
