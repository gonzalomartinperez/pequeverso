import type { ScriptSpec } from "./types.ts";

const IDLE_TIMEOUT_MS = 2000;

type IdleScriptEnv = {
  stillGranted: () => boolean;
  onLoad: () => void;
  doc?: Pick<Document, "getElementById" | "createElement" | "head">;
  win?: Pick<Window, "requestIdleCallback" | "cancelIdleCallback">;
};

/**
 * Injects a vendor loader imperatively once the browser is idle (`requestIdleCallback`, with a
 * timeout fallback), re-reading the stored choice in the same callback that creates the element:
 * there is no render or preload between the consent check and the network request. Returns a
 * canceller (called on withdrawal or unmount).
 */
export function loadWhenIdle(spec: Pick<ScriptSpec, "id" | "src">, env: IdleScriptEnv): () => void {
  const doc = env.doc ?? document;
  const win = env.win ?? window;
  const inject = () => {
    if (!spec.src || !env.stillGranted() || doc.getElementById(spec.id)) return;
    const script = doc.createElement("script");
    script.id = spec.id;
    script.src = spec.src;
    script.async = true;
    script.onload = env.onLoad;
    doc.head.appendChild(script);
  };
  if ("requestIdleCallback" in win) {
    const id = win.requestIdleCallback(inject, { timeout: IDLE_TIMEOUT_MS });
    return () => win.cancelIdleCallback(id);
  }
  const timer = setTimeout(inject, IDLE_TIMEOUT_MS / 4);
  return () => clearTimeout(timer);
}
