import { expect, test } from "./fixtures";

/**
 * The public build has no pixel ID, so the banner must not appear (nothing to decide).
 * When NEXT_PUBLIC_META_PIXEL_ID is set at build time (CI, staging) the pixel runs by default
 * and the banner withdraws it; tests/e2e/tracking.spec.ts covers that behaviour in depth.
 */
test("no consent banner and no third-party cookies without a configured integration", async ({
  page,
  context,
}) => {
  test.skip(!!process.env.E2E_EXPECT_CONSENT, "build was configured with a pixel id");
  await page.goto("/");
  await expect(page.getByTestId("consent-banner")).toHaveCount(0);
  const cookies = await context.cookies();
  expect(cookies.filter((c) => c.name !== "pv_consent")).toEqual([]);
});

test("footer cookie control exists and legal links are complete", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Configurar cookies" })).toBeVisible();
  for (const href of [
    "/aviso-legal/",
    "/privacidad/",
    "/cookies/",
    "/terminos/",
    "/compras-y-reembolsos/",
    "/arrepentimiento/",
    "/soporte/",
  ]) {
    await expect(page.locator(`footer a[href="${href}"]`)).toHaveCount(1);
  }
});

test("footer control opens a necessary-cookies notice when nothing is configured", async ({ page }) => {
  test.skip(!!process.env.E2E_EXPECT_CONSENT, "build was configured with a pixel id");
  await page.goto("/");
  await page.getByRole("button", { name: "Configurar cookies" }).click();
  const banner = page.getByTestId("consent-banner");
  await expect(banner).toBeVisible();
  await expect(banner).toHaveAttribute("data-mode", "notice");
  await expect(banner).toContainText("solo usa cookies propias necesarias");
  await banner.getByRole("button", { name: "Entendido" }).click();
  await expect(banner).toHaveCount(0);
});

test("consent banner (when configured) offers equal accept, reject and configure actions", async ({
  page,
}) => {
  test.skip(!process.env.E2E_EXPECT_CONSENT, "requires a build with NEXT_PUBLIC_META_PIXEL_ID");
  await page.goto("/");
  const banner = page.getByTestId("consent-banner");
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("Meta Pixel");
  await expect(banner).toContainText("Si rechazas, la medición se desactiva");
  await expect(banner.getByRole("button", { name: "Aceptar" })).toBeVisible();
  await expect(banner.getByRole("button", { name: "Rechazar" })).toBeVisible();
  await expect(banner.getByRole("button", { name: "Configurar" })).toBeVisible();
  await banner.getByRole("button", { name: "Rechazar" }).click();
  await expect(banner).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("consent-banner")).toHaveCount(0);
  await expect(page.locator('script[src*="connect.facebook.net"]')).toHaveCount(0);
});

test("footer control reopens the banner (when configured) with the stored selection", async ({ page }) => {
  test.skip(!process.env.E2E_EXPECT_CONSENT, "requires a build with NEXT_PUBLIC_META_PIXEL_ID");
  await page.goto("/");
  const banner = page.getByTestId("consent-banner");
  await banner.getByRole("button", { name: "Rechazar" }).click();
  await expect(banner).toHaveCount(0);
  await page.getByRole("button", { name: "Configurar cookies" }).click();
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Configurar" }).click();
  await expect(banner.getByRole("checkbox", { name: /Marketing/ })).not.toBeChecked();
});
