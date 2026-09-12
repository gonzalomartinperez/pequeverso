"use client";

import { hotmart } from "@config/commerce";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import styles from "./HotmartWidgetSlot.module.css";

declare global {
  interface Window {
    checkoutElements?: { init: (kind: string) => { mount: (selector: string) => void } };
  }
}

type Props = {
  loadingText: string;
  fallbackTitle: string;
  fallbackText: string;
  reloadLabel: string;
  /** Milliseconds before the fallback shows when the widget never renders. */
  timeoutMs?: number;
};

type Status = "loading" | "ready" | "failed";

/**
 * The single Hotmart sales-funnel widget container. Hotmart renders its own Sí/No decision
 * inside; the site never links directly to an upsell/downsell checkout. The slot reserves
 * height (no CLS), is focusable so editorial CTAs can send focus here, announces status,
 * and shows a neutral fallback when the script fails or times out.
 */
export function HotmartWidgetSlot({
  loadingText,
  fallbackTitle,
  fallbackText,
  reloadLabel,
  timeoutMs = 8000,
}: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const mounted = useRef(false);

  const mount = () => {
    if (mounted.current) return;
    if (typeof window.checkoutElements?.init !== "function") return;
    try {
      window.checkoutElements.init("salesFunnel").mount(`#${hotmart.salesFunnelContainerId}`);
      mounted.current = true;
    } catch (error) {
      console.error("Hotmart widget mount failed", error);
      setStatus("failed");
    }
  };

  // Editorial CTAs (data-decision-link) scroll to the slot and move focus into it.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-decision-link]");
      if (!link) return;
      const slot = document.getElementById("decision");
      if (!slot) return;
      event.preventDefault();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      slot.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      slot.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const container = document.getElementById(hotmart.salesFunnelContainerId);
    if (!container) return;
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
    <section className={styles.slot} aria-labelledby="decision-title" id="decision" tabIndex={-1}>
      <h2 id="decision-title" className="visually-hidden">
        Opciones de la oferta
      </h2>
      <div id={hotmart.salesFunnelContainerId} className={styles.container} data-status={status} />
      <p className={styles.status} role="status" aria-live="polite">
        {status === "loading" ? loadingText : null}
      </p>
      {status === "failed" ? (
        <div className={styles.fallback} role="alert" data-testid="widget-fallback">
          <p className={styles.fallbackTitle}>{fallbackTitle}</p>
          <p>{fallbackText}</p>
          <button
            type="button"
            className="button button--secondary button--small"
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
