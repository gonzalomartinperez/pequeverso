import type { Measurement } from "../domain/profile.ts";

/** Four owned requests maximum, five seconds each. No credentials, redirect, referrer or retry. */
export function createPublisher(endpoint: string, fetcher: typeof fetch = fetch) {
  const active = new Set<AbortController>();
  return {
    send(event: Measurement) {
      if (active.size >= 4) return;
      const body = JSON.stringify(event);
      if (new TextEncoder().encode(body).byteLength > 1024) return;
      const controller = new AbortController();
      active.add(controller);
      const timer = setTimeout(() => controller.abort(), 5000);
      void Promise.resolve()
        .then(() =>
          fetcher(endpoint, {
            method: "POST",
            mode: "cors",
            credentials: "omit",
            redirect: "error",
            cache: "no-store",
            referrerPolicy: "no-referrer",
            keepalive: false,
            headers: { "Content-Type": "application/json" },
            body,
            signal: controller.signal,
          }),
        )
        .then((response) => {
          void response.body?.cancel().catch(() => {});
        })
        .catch(() => {})
        .finally(() => {
          clearTimeout(timer);
          active.delete(controller);
        });
    },
    abort() {
      for (const controller of active) controller.abort();
    },
  };
}
