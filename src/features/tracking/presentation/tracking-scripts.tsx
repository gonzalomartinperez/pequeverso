"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import {
  type ConsentState,
  hasConsent,
  onConsentChange,
  readConsent,
} from "@/features/tracking/adapters/consent.ts";
import { enabledAdapters } from "@/features/tracking/adapters/env.ts";
import {
  isTrackingConfigured,
  syncConsent,
  trackPageView,
} from "@/features/tracking/adapters/track.ts";
import type { ScriptSpec } from "@/features/tracking/adapters/types.ts";

const IDLE_TIMEOUT_MS = 2000;

/** True once the browser is idle (`requestIdleCallback`, with a timeout fallback). */
function useIdle(wait: boolean): boolean {
  const [idle, setIdle] = useState(!wait);
  useEffect(() => {
    if (!wait) return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: IDLE_TIMEOUT_MS });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setIdle(true), IDLE_TIMEOUT_MS / 4);
    return () => clearTimeout(timer);
  }, [wait]);
  return idle;
}

function AdapterScript({ spec, onLoad }: { spec: ScriptSpec; onLoad: () => void }) {
  const ready = useIdle(spec.idle === true);
  if (!ready) return null;
  if (spec.src) {
    return (
      <Script
        id={spec.id}
        src={spec.src}
        strategy={spec.strategy}
        onLoad={onLoad}
        {...spec.attributes}
      />
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
 * only for a category the visitor granted (prior opt-in), vendor loaders also after idle
 * (`ScriptSpec.idle`). A rejection after load is
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
