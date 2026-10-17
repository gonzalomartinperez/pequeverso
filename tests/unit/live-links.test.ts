import assert from "node:assert/strict";
import { test } from "node:test";
import { checkInternalLink, type LiveFetch } from "../../scripts/lib/live-links.ts";

const base = "https://store.example.test";
const affiliates = new Set(["/alimentacion-bebe/"]);
const redirect = (location: string, status = 302) => new Response(null, { status, headers: { location } });

function fixture(responses: Response[]) {
  const calls: { url: string; method: string | undefined; redirect: RequestRedirect | undefined }[] = [];
  const fetcher: LiveFetch = async (url, options) => {
    calls.push({ url: url.href, method: options.method, redirect: options.redirect });
    assert.equal(url.origin, base, "the monitor must never request the external merchant");
    assert.equal(options.redirect, "manual");
    const response = responses.shift();
    assert.ok(response, "unexpected request or automatic retry");
    return response;
  };
  return { fetcher, calls };
}

test("validates affiliate HEAD handoff without requesting an external merchant that could return 401", async () => {
  for (const status of [302, 307]) {
    const { fetcher, calls } = fixture([redirect("https://go.hotmart.com/EXAMPLE?src=sitio-home", status)]);
    const result = await checkInternalLink(base, "/alimentacion-bebe/?src=sitio-home", affiliates, fetcher);
    assert.equal(result.ok, true);
    assert.equal(result.affiliateRedirect, true);
    assert.match(result.detail, /external response not probed/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.method, "HEAD");
  }
});

test("retains a manual GET fallback for origin HEAD 405 only", async () => {
  const { fetcher, calls } = fixture([
    new Response(null, { status: 405 }),
    redirect("https://pay.hotmart.com/EXAMPLE"),
  ]);
  assert.equal((await checkInternalLink(base, "/alimentacion-bebe/", affiliates, fetcher)).ok, true);
  assert.deepEqual(
    calls.map((call) => call.method),
    ["HEAD", "GET"],
  );
});

test("keeps real storefront 4xx/5xx failures visible without GET bypass or retries", async () => {
  for (const status of [401, 403, 404, 429, 500, 503]) {
    const { fetcher, calls } = fixture([new Response(null, { status })]);
    const result = await checkInternalLink(base, "/alimentacion-bebe/", affiliates, fetcher);
    assert.equal(result.ok, false);
    assert.match(result.detail, new RegExp(String(status)));
    assert.equal(calls.length, 1);
  }
});

test("ordinary internal pages and bounded same-origin redirects still resolve", async () => {
  const { fetcher, calls } = fixture([redirect("/about/", 308), new Response("ok")]);
  const result = await checkInternalLink(base, "/about", affiliates, fetcher);
  assert.equal(result.ok, true);
  assert.equal(result.affiliateRedirect, false);
  assert.equal(calls.length, 2);
  const alias = fixture([redirect("/alimentacion-bebe/", 308), redirect("https://hotmart.com/EXAMPLE", 307)]);
  assert.equal((await checkInternalLink(base, "/alimentacion-bebe", affiliates, alias.fetcher)).ok, true);
});

test("a configured affiliate must actually hand off; a 200 or internal dead end is not success", async () => {
  for (const responses of [[new Response("wrong page")], [redirect("/about/"), new Response("wrong page")]]) {
    const { fetcher } = fixture(responses);
    const result = await checkInternalLink(base, "/alimentacion-bebe/", affiliates, fetcher);
    assert.equal(result.ok, false);
    assert.match(result.detail, /without a merchant redirect/);
  }
});

test("rejects arbitrary external destinations and merchant redirects from undeclared paths", async () => {
  for (const location of [
    "https://evil.example/",
    "https://go.hotmart.com.evil.example/",
    "http://go.hotmart.com/EXAMPLE",
    "https://go.hotmart.com:8443/EXAMPLE",
    "https://user:password@go.hotmart.com/EXAMPLE",
    "javascript:alert(1)",
    "https://[invalid",
  ]) {
    const { fetcher, calls } = fixture([redirect(location)]);
    assert.equal((await checkInternalLink(base, "/alimentacion-bebe/", affiliates, fetcher)).ok, false);
    assert.equal(calls.length, 1);
  }
  const { fetcher } = fixture([redirect("https://go.hotmart.com/EXAMPLE")]);
  assert.equal((await checkInternalLink(base, "/ordinary/", affiliates, fetcher)).ok, false);
});

test("rejects missing Location, permanent external handoffs and redirect loops", async () => {
  for (const response of [
    new Response(null, { status: 302 }),
    redirect("https://go.hotmart.com/EXAMPLE", 301),
    redirect("https://go.hotmart.com/EXAMPLE", 308),
    redirect("/alimentacion-bebe/"),
  ]) {
    const { fetcher, calls } = fixture([response]);
    assert.equal((await checkInternalLink(base, "/alimentacion-bebe/", affiliates, fetcher)).ok, false);
    assert.equal(calls.length, 1);
  }
});

test("limits internal redirect hops without weakening or following to an unknown external host", async () => {
  const { fetcher, calls } = fixture(Array.from({ length: 9 }, (_, i) => redirect(`/hop-${i + 1}/`)));
  const result = await checkInternalLink(base, "/start/", affiliates, fetcher);
  assert.equal(result.ok, false);
  assert.match(result.detail, /more than 8/);
  assert.equal(calls.length, 9);
});
