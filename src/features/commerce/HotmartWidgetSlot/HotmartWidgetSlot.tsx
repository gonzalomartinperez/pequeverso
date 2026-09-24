"use client";

import { hotmart } from "@config/commerce";
import Script from "next/script";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import styles from "./HotmartWidgetSlot.module.css";

declare global {
  interface Window {
    checkoutElements?: { init: (kind: string) => { mount: (selector: string) => void } };
  }
}

/** Legacy anchor id from the WordPress landings; editorial CTAs and old links point here. */
export const DECISION_ANCHOR = "gfp-decision";

type Props = {
  /** Mode-aware kicker / title / copy rendered above the widget (both variants, CSS-toggled). */
  heading: ReactNode;
  loadingText: string;
  fallbackTitle: string;
  fallbackText: string;
  reloadLabel: string;
  /** Milliseconds before the fallback shows when the widget never renders. */
  timeoutMs?: number;
};

type Status = "loading" | "ready" | "failed";

/** Containers Hotmart has already mounted into — survives React re-renders and StrictMode. */
const mountedContainers = new WeakSet<Element>();

/**
 * The single Hotmart sales-funnel widget container (`#hotmart-sales-funnel`), the Next.js
 * adaptation of Hotmart's snippet:
 *
 *   <div id="hotmart-sales-funnel"></div>
 *   <script src="https://checkout.hotmart.com/lib/hotmart-checkout-elements.js"></script>
 *   <script>checkoutElements.init('salesFunnel').mount('#hotmart-sales-funnel')</script>
 *
 * - The library loads client-side through next/script (loaded once per document, even across
 *   client navigations); `mount()` runs only after the script is ready AND the container exists.
 * - A WeakSet of mounted containers plus a child-count check prevent duplicate mounts during
 *   React lifecycle events (StrictMode double effects, re-renders, back/forward navigation).
 * - Hotmart renders its own Sí/No decision and owns acceptance, rejection, progression and the
 *   purchase-session context; the site never links to an upsell/downsell checkout, never
 *   invents offer ids and never reports a purchase.
 * - The slot reserves height (no CLS), is a focus target for editorial CTAs, announces status,
 *   and shows a neutral fallback when the script fails or nothing renders in time. A direct
 *   visit without an active purchase session may show Hotmart's own "purchase in progress"
 *   message inside the container — that is expected and not an error.
 */
export function HotmartWidgetSlot({
  heading,
  loadingText,
  fallbackTitle,
  fallbackText,
  reloadLabel,
  timeoutMs = 8000,
}: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const mount = useCallback(() => {
    const container = containerRef.current;
    if (!container || mountedContainers.has(container) || container.childElementCount > 0) return;
    if (typeof window.checkoutElements?.init !== "function") return;
    try {
      window.checkoutElements.init("salesFunnel").mount(`#${hotmart.salesFunnelContainerId}`);
      mountedContainers.add(container);
    } catch (error) {
      console.error("Hotmart widget mount failed", error);
      setStatus("failed");
    }
  }, []);

  // Library already present (client-side navigation back to this page): mount immediately.
  useEffect(() => {
    mount();
  }, [mount]);

  // Editorial CTAs (data-decision-link) scroll to the slot and move focus into it.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-decision-link]");
      if (!link) return;
      const slot = document.getElementById(DECISION_ANCHOR);
      if (!slot) return;
      event.preventDefault();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      slot.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      slot.focus({ preventScroll: true });
      history.replaceState(null, "", `#${DECISION_ANCHOR}`);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Status: "ready" once Hotmart renders anything inside the container; "failed" on timeout.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (container.childElementCount > 0) {
      setStatus("ready");
      return;
    }
    const observer = new MutationObserver(() => {
      if (container.childElementCount > 0) {
        setStatus("ready");
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    const timer = window.setTimeout(() => {
      setStatus((current) => (current === "loading" ? "failed" : current));
    }, timeoutMs);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [timeoutMs]);

  return (
    <section
      className={`on-light ${styles.slot}`}
      aria-labelledby="gfp-decision-title"
      id={DECISION_ANCHOR}
      tabIndex={-1}
    >
      <div className={styles.heading}>{heading}</div>
      <div
        id={hotmart.salesFunnelContainerId}
        ref={containerRef}
        className={styles.container}
        data-status={status}
      />
      <p className={styles.status} role="status" aria-live="polite">
        {status === "loading" ? loadingText : null}
      </p>
      {status === "failed" ? (
        <div className={styles.fallback} role="alert" data-testid="widget-fallback">
          <p className={styles.fallbackTitle}>{fallbackTitle}</p>
          <p>{fallbackText}</p>
          <button
            type="button"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            onClick={() => window.location.reload()}
          >
            {reloadLabel}
          </button>
        </div>
      ) : null}
      <Script
        id="hotmart-funnel"
        src={hotmart.salesFunnelScript}
        strategy="afterInteractive"
        onLoad={mount}
        onReady={mount}
        onError={() => setStatus("failed")}
      />
    </section>
  );
}
