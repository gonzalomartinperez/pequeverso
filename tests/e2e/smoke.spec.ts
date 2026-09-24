import { expect, test } from "./fixtures";

const routes = [
  "/",
  "/grafismo-fonetico/",
  "/imprime-y-juega/",
  "/grafismo-fonetico/gracias/",
  "/soporte/",
  "/privacidad/",
];

for (const route of routes) {
  test(`renders ${route} with one h1 and complete landmarks`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1:visible")).toHaveCount(1);
    await expect(page.locator("main#contenido")).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });
}

test("unknown route returns a real 404 with navigation", async ({ page }) => {
  const response = await page.goto("/esta-ruta-no-existe/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("no existe");
  await expect(page.locator('a[href="/grafismo-fonetico/"]').first()).toBeVisible();
});

test("non-slash URL redirects to the trailing-slash canonical", async ({ request }) => {
  const response = await request.get("/grafismo-fonetico", { maxRedirects: 0 });
  expect([301, 308]).toContain(response.status());
  expect(response.headers().location).toMatch(/\/grafismo-fonetico\/$/);
});

test("no horizontal overflow at the current viewport", async ({ page }) => {
  for (const route of ["/", "/grafismo-fonetico/", "/imprime-y-juega/"]) {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${route} overflows horizontally`).toBeLessThanOrEqual(0);
  }
});

test("the Meta CAPI relay is mounted: 204 without a token, 400 on an empty batch with one; no-store, POST only", async ({
  request,
}) => {
  const response = await request.post("/api/meta/events/", {
    headers: { "content-type": "application/json" },
    data: { events: [] },
  });
  expect([204, 400]).toContain(response.status());
  if (response.status() === 400) expect(await response.json()).toEqual({ error: "events" });
  expect(response.headers()["cache-control"]).toBe("no-store");
  const get = await request.get("/api/meta/events/");
  expect(get.status()).toBe(405);
});
