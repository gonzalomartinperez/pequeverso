"use client";

import { type ComponentType, useEffect, useRef, useState } from "react";
import { onConsentChange, readConsent } from "@/features/consent/adapters/browser-storage.ts";
import { explicitGrant, type GatedIntegration } from "@/features/consent/domain/policy.ts";

type UiProps = {
  classes: { primary: string };
  integrations: readonly GatedIntegration[];
  reopen: boolean;
  opener: HTMLElement | null;
};

const FIRST_PAINT_TIMEOUT_MS = 2500;

/**
 * Runs `callback` after the first paint (two animation frames) once the browser is idle
 * (`requestIdleCallback`, with a timeout fallback), so the banner is never the LCP element nor
 * a layout shift. Returns a canceller.
 */
function afterFirstPaint(callback: () => void): () => void {
  let cancelled = false;
  let frame = 0;
  let idle = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    if (!cancelled) callback();
  };
  frame = window.requestAnimationFrame(() => {
    frame = window.requestAnimationFrame(() => {
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(run, { timeout: FIRST_PAINT_TIMEOUT_MS });
      else timer = setTimeout(run, 200);
    });
  });
  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frame);
    if (idle) window.cancelIdleCallback(idle);
    clearTimeout(timer);
  };
}

type Request = { reopen: boolean; opener: HTMLElement | null };

type Props = {
  /** Button classes computed on the server (`buttonVariants`), keeping variant tables out of the layout chunk. */
  classes: { primary: string };
  /** Enabled gated integrations, from the composition root (consent never imports tracking). */
  integrations: readonly GatedIntegration[];
  /** Whether the site analytics tool is built in (it needs a fresh analytics opt-in). */
  analyticsBuilt: boolean;
};

/**
 * Trigger for the cookie banner: reads the stored choice and, on a first visit (after first paint
 * and idle, only with a gated integration) or on `pv:consent:open` from the footer control, loads
 * the banner chunk on demand. Only this reader and the trigger ship in the initial bundle.
 */
export function ConsentBanner({ classes, integrations, analyticsBuilt }: Props) {
  const [request, setRequest] = useState<Request | null>(null);
  const [Ui, setUi] = useState<ComponentType<UiProps> | null>(null);
  const loaded = useRef(false);
  const requested = request !== null;
  // Primitives in the effect's dependencies: build-time values, so the listeners mount once.
  const hasIntegrations = integrations.length > 0;

  // The banner UI and its copy are a separate chunk, fetched only once the banner is requested.
  // A failed fetch clears the request, so the next trigger or footer click retries it.
  useEffect(() => {
    if (!requested) return;
    let live = true;
    import("./consent-banner-ui.tsx").then(
      (module) => {
        if (!live) return;
        loaded.current = true;
        setUi(() => module.ConsentBannerUi);
      },
      () => {
        if (live) setRequest(null);
      },
    );
    return () => {
      live = false;
    };
  }, [requested]);

  useEffect(() => {
    let cancelFirstVisit = () => {};
    const gated = analyticsBuilt || hasIntegrations;
    const firstVisit = () => setRequest((current) => current ?? { reopen: false, opener: null });
    if (gated) {
      const stored = readConsent();
      const needsChoice =
        stored === null ||
        (analyticsBuilt && stored.analytics && !explicitGrant(stored, Date.now()));
      if (needsChoice) cancelFirstVisit = afterFirstPaint(firstVisit);
    }
    // Once the UI is mounted it handles both events itself; before that, the trigger requests it.
    const open = () => {
      if (loaded.current) return;
      const active = document.activeElement;
      const opener = active instanceof HTMLElement && active !== document.body ? active : null;
      // A footer click while the first-visit chunk loads upgrades the request (opener, stored seed).
      setRequest({ reopen: true, opener });
    };
    window.addEventListener("pv:consent:open", open);
    // Storage cleared elsewhere (no valid choice left): ask again, as the inline banner did.
    const unsubscribe = onConsentChange((state) => {
      if (state === null && gated && !loaded.current) firstVisit();
    });
    return () => {
      cancelFirstVisit();
      window.removeEventListener("pv:consent:open", open);
      unsubscribe();
    };
  }, [analyticsBuilt, hasIntegrations]);

  if (request === null || Ui === null) return null;
  return (
    <Ui
      classes={classes}
      integrations={integrations}
      reopen={request.reopen}
      opener={request.opener}
    />
  );
}
