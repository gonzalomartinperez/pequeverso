"use client";

import { hotmart } from "@config/commerce";
import Script from "next/script";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";

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

/** Light card with a gold → turquoise ring drawn in the border box (static; no motion next to the decision). */
const CARD_SURFACE =
  "linear-gradient(180deg, var(--pv-white), oklch(0.985 0.012 230)) padding-box, conic-gradient(from 210deg, var(--pv-gold), var(--pv-turquoise), var(--pv-white), var(--pv-turquoise), var(--pv-gold)) border-box";

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
 * - The slot reserves height (`--widget-min-h`: 220 px, 180 px from md; no CLS), is a focus
 *   target for editorial CTAs, announces status and shows a neutral fallback when the script
 *   fails or nothing renders in time (the empty container then gives its reserved height to
 *   the notice, so the page barely moves). The loading state is a static tint with a decorative
 *   skeleton of the Sí/No buttons drawn beside (never inside) the container, so Hotmart's
 *   child-count check is untouched (no motion next to the decision); below 400 px the container bleeds to the viewport edges because Hotmart's
 *   iframe carries an inline `min-width: 320px`. A direct
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
      className="on-light relative grid scroll-mt-[calc(var(--header-height)+var(--space-4))] grid-cols-[minmax(0,1fr)] gap-4 rounded-2xl border-[3px] border-transparent p-4 text-card-foreground shadow-[0_2px_0_oklch(1_0_0/0.6)_inset,0_40px_90px_-30px_oklch(0.08_0.05_256/0.75),0_0_0_10px_oklch(1_0_0/0.06)] [--widget-min-h:220px] focus-visible:outline-offset-6 sm:p-6 md:p-8 md:[--widget-min-h:180px]"
      style={{ background: CARD_SURFACE }}
      aria-labelledby="gfp-decision-title"
      id={DECISION_ANCHOR}
      tabIndex={-1}
    >
      <div className="grid gap-2 text-center [&_h2]:text-[clamp(1.55rem,1.2rem+1.2vw,2.1rem)] [&_h2]:leading-tight [&_p:last-child]:mx-auto [&_p:last-child]:max-w-[46ch] [&_p:last-child]:text-small [&_p:last-child]:text-pretty [&_[data-slot=kicker]]:mx-auto">
        {heading}
      </div>
      <div className="relative grid">
        <div
          id={hotmart.salesFunnelContainerId}
          ref={containerRef}
          className="min-h-(--widget-min-h) min-w-0 rounded-lg data-[status=failed]:min-h-0 data-[status=loading]:bg-[linear-gradient(180deg,oklch(0.97_0.02_230),oklch(0.985_0.012_85))] max-[399.98px]:mx-[calc(50%-50vw)] max-[399.98px]:w-screen max-[399.98px]:rounded-none"
          data-status={status}
        />
        {status === "loading" ? (
          <div
            aria-hidden="true"
            data-slot="widget-skeleton"
            className="pointer-events-none absolute inset-0 grid content-center justify-items-center gap-3 p-6"
          >
            <span className="h-3 w-40 rounded-pill bg-navy/8" />
            <span className="h-12 w-full max-w-80 rounded-pill bg-teal/14" />
            <span className="h-12 w-full max-w-80 rounded-pill border-2 border-navy/10" />
          </div>
        ) : null}
      </div>
      <p
        className="flex min-h-[1.4em] items-center justify-center gap-2 text-center text-small text-subtle empty:hidden"
        role="status"
        aria-live="polite"
      >
        {status === "loading" ? loadingText : null}
      </p>
      {status === "failed" ? (
        <div
          className="grid justify-items-start gap-2 rounded-lg border border-gold/50 bg-lemon p-5"
          role="alert"
          data-testid="widget-fallback"
        >
          <p className="font-extrabold text-ink">{fallbackTitle}</p>
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
