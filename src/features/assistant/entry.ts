import { createHttpTransport } from "./adapters/http.ts";
import { type Assistant, createAssistant } from "./application/assistant.ts";
import type { LinkPolicy } from "./domain/links.ts";

/**
 * Composition root: the only module that wires the controller to its HTTP adapter. The API is a
 * separate origin configured at build time (`NEXT_PUBLIC_ASSISTANT_API_ORIGIN`).
 */
export function createStoreAssistant(apiOrigin: string, policy: LinkPolicy): Assistant {
  return createAssistant(
    createHttpTransport(apiOrigin, fetch, { responseLanguage: "es" }),
    {
      id: () => crypto.randomUUID(),
      now: () => new Date().toISOString(),
      wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
      timeout: (milliseconds) => AbortSignal.timeout(milliseconds),
    },
    { policy, locale: "es" },
  );
}
