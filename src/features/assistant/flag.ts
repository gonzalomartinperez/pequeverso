/**
 * Build-time switch of the native shopping assistant. Pure (no `process` access), so
 * scripts/check-env.ts and unit tests can run it under Node. The assistant ships DISABLED:
 * enabling it is a separate owner decision and, for the static export, a rebuild.
 *
 * - `NEXT_PUBLIC_ASSISTANT_ENABLED` absent, empty or `false` → disabled (no launcher, no panel,
 *   no session, no API call; the assistant code is not even emitted).
 * - `true` → enabled; `NEXT_PUBLIC_ASSISTANT_API_ORIGIN` is then required: a bare `https://`
 *   origin, or `http(s)://localhost|127.0.0.1:<port>` only when `ASSISTANT_LOCAL_TEST_BUILD=true`.
 * - Anything else fails the build. Error messages never echo the received values.
 */

export type AssistantEnv = {
  enabled?: string | undefined;
  apiOrigin?: string | undefined;
  localTestBuild?: string | undefined;
};

export type AssistantFlag = { enabled: false } | { enabled: true; apiOrigin: string; localTest: boolean };

export type AssistantFlagResult = { ok: true; flag: AssistantFlag } | { ok: false; errors: string[] };

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function bareOrigin(value: string, allowLocalHttp: boolean): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password || url.search || url.hash) return null;
  if (url.pathname !== "/" || !value.replace(/\/$/, "").endsWith(url.host)) return null;
  if (url.protocol === "https:" && !LOCAL_HOSTS.has(url.hostname)) return url.origin;
  if (allowLocalHttp && /^https?:$/.test(url.protocol) && LOCAL_HOSTS.has(url.hostname)) return url.origin;
  return null;
}

export function parseAssistantEnv(env: AssistantEnv): AssistantFlagResult {
  const raw = (env.enabled ?? "").trim();
  if (raw === "" || raw === "false") return { ok: true, flag: { enabled: false } };
  if (raw !== "true")
    return { ok: false, errors: ['NEXT_PUBLIC_ASSISTANT_ENABLED must be "true" or "false" (or unset)'] };
  const localTest = (env.localTestBuild ?? "").trim() === "true";
  const origin = bareOrigin((env.apiOrigin ?? "").trim(), localTest);
  if (!origin)
    return {
      ok: false,
      errors: [
        localTest
          ? "NEXT_PUBLIC_ASSISTANT_API_ORIGIN must be a bare https:// origin or http(s)://localhost|127.0.0.1:<port>"
          : "NEXT_PUBLIC_ASSISTANT_API_ORIGIN must be a bare https:// origin when the assistant is enabled",
      ],
    };
  return { ok: true, flag: { enabled: true, apiOrigin: origin, localTest } };
}
