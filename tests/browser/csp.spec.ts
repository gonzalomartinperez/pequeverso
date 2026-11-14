import { loadEdgeRules } from "../../tools/lib/edge-rules.ts";
import { expect, test } from "./fixtures";

/**
 * ADR-0014: the enforced Content-Security-Policy from config/edge-rules.json must not block
 * anything the site itself needs on any route. The static test server sends no edge headers (they
 * live in .htaccess / next.config), so the policy is attached to every same-origin document here;
 * a standalone server that already sends it simply gets the same value. Violations are collected
 * from `securitypolicyviolation` events and from Chromium console errors. Third-party hosts
 * (Meta, Hotmart) are not reachable in CI, so their allow-list is covered by tests/unit/csp.test.ts.
 */
const policy =
  loadEdgeRules(undefined, {}).headers.find((rule) => rule.id === "security")?.headers[
    "Content-Security-Policy"
  ] ?? "";

const routes = [
  "/",
  "/grafismo-fonetico/",
  "/imprime-y-juega/",
  "/imprime-y-juega/?downsell=1",
  "/grafismo-fonetico/gracias/",
  "/soporte/",
  "/privacidad/",
  "/terminos/",
  "/cookies/",
  "/aviso-legal/",
  "/arrepentimiento/",
  "/esta-no-existe/",
];

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

test.beforeEach(async ({ page, baseURL }) => {
  expect(policy).not.toBe("");
  const origin = new URL(baseURL ?? "http://localhost").origin;
  await page.route(
    (url) => url.origin === origin,
    async (route) => {
      if (route.request().resourceType() !== "document") return route.fallback();
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), "content-security-policy": policy },
      });
    },
  );
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations?.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
});

for (const route of routes) {
  test(`no CSP violation: ${route}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (/content security policy/i.test(message.text())) consoleErrors.push(message.text());
    });
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    // Reach the consent and cookie surfaces and the lazily loaded sections.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__cspViolations)).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test("the policy is really enforced (negative control)", async ({ page }) => {
  await page.goto("/");
  // page.evaluate bypasses CSP (CDP), so the probe is a DOM script element the page itself loads.
  const blocked = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        document.addEventListener("securitypolicyviolation", () => resolve(true), { once: true });
        const script = document.createElement("script");
        script.src = "https://cloudflareinsights.invalid/beacon.min.js";
        script.addEventListener("load", () => resolve(false));
        document.head.append(script);
        setTimeout(() => resolve(false), 3000);
      }),
  );
  expect(blocked).toBe(true);
});
