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
import { loadWhenIdle } from "@/features/tracking/adapters/idle-script.ts";
import {
  isTrackingConfigured,
  syncConsent,
  trackPageView,
} from "@/features/tracking/adapters/track.ts";
import type { ScriptSpec } from "@/features/tracking/adapters/types.ts";

type ScriptProps = { spec: ScriptSpec; onLoad: () => void; stillGranted: () => boolean };

/** Vendor loader: no `next/script` (it may preload during render); injected imperatively when idle. */
function IdleLoader({ spec, onLoad, stillGranted }: ScriptProps) {
  const latest = useRef({ onLoad, stillGranted });
  latest.current = { onLoad, stillGranted };
  const { id, src } = spec;
  // The spec object is rebuilt every render; its identity is `id` and `src`.
  useEffect(
    () =>
      loadWhenIdle(
        { id, ...(src ? { src } : {}) },
        {
          onLoad: () => latest.current.onLoad(),
          stillGranted: () => latest.current.stillGranted(),
        },
      ),
    [id, src],
  );
  return null;
}

function AdapterScript(props: ScriptProps) {
  const { spec, onLoad } = props;
  if (spec.idle) return <IdleLoader {...props} />;
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
 * (`ScriptSpec.idle`), re-checked against storage right before injection and cancelled on a
 * withdrawal in any tab. A rejection after load is handled by the adapter's `onConsent` (vendor revoke). Fires PageView on the first load and on
 * every client-side navigation. Renders nothing without configuration.
 */
export function Analytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState | null | undefined>(undefined);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    // `onConsentChange` hands over validated storage (this tab and other tabs), never a payload.
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
    hasConsent(adapter.category, consent)
      ? adapter.scripts().map((spec) => ({ spec, category: adapter.category }))
      : [],
  );

  return (
    <>
      {scripts.map(({ spec, category }) => (
        <AdapterScript
          key={spec.id}
          spec={spec}
          onLoad={syncConsent}
          stillGranted={() => hasConsent(category, readConsent())}
        />
      ))}
    </>
  );
}
