/** Pure build inputs, shared with sparse tools/config checkouts. Never prints received values. */
export type AnalyticsFlag = { enabled: false } | { enabled: true; endpoint: string };
export function parseAnalyticsEnv(input: {
  enabled?: string | undefined;
  apiOrigin?: string | undefined;
  localTestBuild?: string | undefined;
}): AnalyticsFlag {
  if (input.enabled === undefined || input.enabled === "" || input.enabled === "false")
    return { enabled: false };
  if (input.enabled !== "true") throw new Error("Product analytics flag must be true or false");
  let url: URL;
  try {
    url = new URL(input.apiOrigin ?? "");
  } catch {
    throw new Error("Product analytics requires an API origin");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !input.apiOrigin?.replace(/\/$/, "").endsWith(url.host) ||
    (loopback && input.localTestBuild !== "true") ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback && input.localTestBuild === "true"))
  ) {
    throw new Error(
      "Product analytics requires a bare HTTPS API origin; loopback needs an isolated test build",
    );
  }
  return { enabled: true, endpoint: `${url.origin}/api/v1/analytics/events` };
}
