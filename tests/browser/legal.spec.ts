import { hotmart } from "../../config/commerce.ts";
import { seller } from "../../content/es/legal/seller.ts";
import { expect, test } from "./fixtures";

/**
 * Argentine consumer-law surface (docs/legal-checklist.md): the "Botón de arrepentimiento"
 * (Disposición SSDCyLC 954/2025, which replaced Res. SCI 424/2020) is reachable from the home page without registration, and its page
 * gives both revocation routes. The seller identification is published on the legal pages.
 */
test("home footer links the Botón de arrepentimiento with its exact label", async ({ page }) => {
  await page.goto("/");
  const link = page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Botón de arrepentimiento", exact: true });
  await expect(link).toHaveAttribute("href", "/arrepentimiento/");
  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeVisible();
});

test("/arrepentimiento/ gives the email route, the Hotmart refund link and the 24 h code", async ({
  page,
}) => {
  await page.goto("/arrepentimiento/");
  await expect(page.getByRole("heading", { level: 1, name: "Botón de arrepentimiento" })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.locator(`a[href^="mailto:${seller.supportEmail}"]`).first()).toBeVisible();
  await expect(main.locator(`a[href="${hotmart.refunds}"]`).first()).toBeVisible();
  await expect(main).toContainText("24 horas");
  await expect(main).toContainText("10 días corridos");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("aviso legal publishes the seller identification", async ({ page }) => {
  await page.goto("/aviso-legal/");
  const main = page.getByRole("main");
  for (const value of [seller.legalName, seller.taxId, seller.address]) {
    await expect(main).toContainText(value);
  }
  await expect(main).not.toContainText("pendiente de publicación");
});

for (const path of [
  "/",
  "/grafismo-fonetico/",
  "/imprime-y-juega/",
  "/grafismo-fonetico/gracias/",
  "/terminos/",
]) {
  test(`${path}: the Botón de arrepentimiento is visible on the first screen`, async ({ page }) => {
    await page.goto(path);
    const link = page
      .locator('[data-slot="withdrawal-strip"]')
      .getByRole("link", { name: "Botón de arrepentimiento", exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/arrepentimiento/");
    const box = await link.boundingBox();
    const viewport = page.viewportSize();
    expect(box && viewport && box.y + box.height <= viewport.height).toBe(true);
  });
}
