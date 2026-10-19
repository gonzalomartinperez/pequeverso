import { onConsentChange, readConsent } from "../tracking/adapters/consent.ts";
import { observePublicSections } from "./adapters/browser.ts";
import { createPublisher } from "./adapters/http.ts";
import { createCollection } from "./application/collection.ts";
import { createConsentGate } from "./domain/consent.ts";
import { routeOf, viewportOf } from "./domain/profile.ts";

/** The only composition root. Meta adapters/default consent and existing events stay independent. */
export function startSiteAnalytics(
  endpoint: string,
  initialPath: string,
  view: Window & typeof globalThis = window,
) {
  const gate = createConsentGate();
  const publisher = createPublisher(endpoint, view.fetch.bind(view));
  const controller = createCollection({
    uuid: () => view.crypto.randomUUID(),
    viewport: () => viewportOf(view.innerWidth),
    send: (event) => {
      if (gate.allows(readConsent(), Date.now())) publisher.send(event);
      else publisher.abort();
    },
    abort: () => publisher.abort(),
    now: () => view.performance.now(),
  });
  let path = initialPath,
    dispose = () => {},
    stopped = false;
  function refresh() {
    dispose();
    dispose = () => {};
    // A missing/invalid stored decision never inherits the marketing opt-out default.
    const allowed = gate.allows(readConsent(), Date.now()) && view.document.visibilityState === "visible";
    controller.consent(allowed);
    const route = routeOf(path);
    if (!stopped && allowed && route) dispose = observePublicSections(view, route, controller);
  }
  function navigate(next: string) {
    // Re-read the stored choice before a new route can dispatch; never reuse an old grant.
    dispose();
    controller.consent(false);
    path = next;
    controller.navigate(path);
    refresh();
  }
  const unsubscribe = onConsentChange((state) => {
    gate.persisted(state, readConsent(), Date.now());
    refresh();
  });
  const withdraw = () => {
    gate.withdraw(readConsent());
    refresh();
  };
  view.addEventListener("pv:site-analytics:withdraw", withdraw);
  const storage = (event: StorageEvent) => {
    if (event.key === "pv_consent" || event.key === null) refresh();
  };
  const pagehide = () => {
    dispose();
    publisher.abort();
    controller.consent(false);
  };
  view.addEventListener("storage", storage);
  view.addEventListener("pagehide", pagehide);
  view.addEventListener("pageshow", refresh);
  view.document.addEventListener("visibilitychange", refresh);
  const queries = [view.matchMedia("(min-width: 768px)"), view.matchMedia("(min-width: 1024px)")];
  for (const query of queries) query.addEventListener("change", refresh);
  navigate(path);
  return {
    navigate,
    stop() {
      stopped = true;
      dispose();
      controller.stop();
      unsubscribe();
      view.removeEventListener("pv:site-analytics:withdraw", withdraw);
      view.removeEventListener("storage", storage);
      view.removeEventListener("pagehide", pagehide);
      view.removeEventListener("pageshow", refresh);
      view.document.removeEventListener("visibilitychange", refresh);
      for (const query of queries) query.removeEventListener("change", refresh);
    },
  };
}
