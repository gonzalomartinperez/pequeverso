/** Read-only origin checks: never follow an affiliate into the merchant's own availability policy. */
export type LiveFetch = (url: URL, options: RequestInit) => Promise<Response>;
export type LinkCheck = { ok: boolean; detail: string; affiliateRedirect: boolean };

// Monitoring policy only. A future producer-owned destination needs explicit review here;
// a Location header never authorizes its own host. Do not store an affiliate code/URL in source.
const AFFILIATE_HOSTS = new Set(["go.hotmart.com", "pay.hotmart.com", "hotmart.com"]);
const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 8;

export async function checkInternalLink(
  base: string,
  target: string,
  affiliatePaths: ReadonlySet<string>,
  fetcher: LiveFetch = fetch,
): Promise<LinkCheck> {
  const origin = new URL(base).origin;
  let url = new URL(target, `${origin}/`);
  const seen = new Set<string>();
  let affiliateRoute = false;
  const failed = (detail: string): LinkCheck => ({ ok: false, detail, affiliateRedirect: false });
  if (url.origin !== origin) return failed("target is outside the monitored origin");
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (seen.has(url.href)) return failed("internal redirect loop");
    seen.add(url.href);
    affiliateRoute ||= affiliatePaths.has(url.pathname);
    let response = await fetcher(url, { method: "HEAD", redirect: "manual" });
    if (response.status === 405) response = await fetcher(url, { method: "GET", redirect: "manual" });
    if (!REDIRECTS.has(response.status)) {
      if (affiliateRoute && response.ok)
        return failed(`affiliate route returned ${response.status} without a merchant redirect`);
      return response.ok
        ? { ok: true, detail: `${response.status}`, affiliateRedirect: false }
        : failed(`origin returned ${response.status}`);
    }
    const location = response.headers.get("location");
    if (!location) return failed(`redirect ${response.status} has no Location`);
    let next: URL;
    try {
      next = new URL(location, url);
    } catch {
      return failed("redirect has an invalid Location");
    }
    if (next.username || next.password) return failed("redirect contains credentials");
    if (next.origin === origin) {
      url = next;
      continue;
    }
    if (!affiliatePaths.has(url.pathname)) return failed("unexpected external redirect");
    if (response.status !== 302 && response.status !== 307)
      return failed(`affiliate redirect must be temporary (received ${response.status})`);
    if (next.protocol !== "https:" || !AFFILIATE_HOSTS.has(next.hostname) || next.port)
      return failed("affiliate redirect destination is not an approved HTTPS merchant origin");
    return {
      ok: true,
      detail: `${response.status} to approved merchant ${next.hostname}; external response not probed`,
      affiliateRedirect: true,
    };
  }
  return failed(`more than ${MAX_REDIRECTS} internal redirects`);
}
