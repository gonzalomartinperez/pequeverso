import { expect, test } from "./fixtures";

/**
 * The publishable export ships without the native assistant (docs/assistant.md). Runs against the
 * real default build: no launcher, no assistant script and no assistant request on any page type.
 */
const MARKERS = ["assistant-launcher", "pv-assistant-panel", "/api/v1/session", "Idempotency-Key"];

for (const route of ["/", "/grafismo-fonetico/", "/soporte/"]) {
  test(`ships ${route} without the assistant`, async ({ page, request }) => {
    const urls: string[] = [];
    page.on("request", (req) => urls.push(req.url()));
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("assistant-launcher")).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: /Asistente/ })).toHaveCount(0);
    expect(urls.filter((url) => url.includes("/api/v1/"))).toEqual([]);
    const scripts = await page
      .locator("script[src]")
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLScriptElement).src));
    for (const src of scripts) {
      const body = await (await request.get(src)).text();
      for (const marker of MARKERS) expect(body.includes(marker), `${src} contains ${marker}`).toBe(false);
    }
    expect(await page.content()).not.toContain("Asistente Pequeverso");
  });
}
