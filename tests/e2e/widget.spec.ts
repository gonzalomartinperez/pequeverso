import { expect, test } from "@playwright/test";

test("shows a neutral fallback when the Hotmart widget script fails", async ({ page }) => {
  await page.route("**/hotmart-checkout-elements.js", (route) => route.abort());
  await page.goto("/imprime-y-juega/");
  await expect(page.getByTestId("widget-fallback")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("widget-fallback")).not.toContainText("pay.hotmart.com");
  await expect(page.locator("#hotmart-sales-funnel")).toHaveCount(1);
});

test("shows the fallback when the script loads but never renders (timeout)", async ({ page }) => {
  await page.route("**/hotmart-checkout-elements.js", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.checkoutElements={init:function(){return {mount:function(){}}}};",
    }),
  );
  await page.goto("/imprime-y-juega/");
  await expect(page.getByTestId("widget-fallback")).toBeVisible({ timeout: 12_000 });
});

test("widget slot reserves height so the page does not shift when the script fails", async ({ page }) => {
  await page.route("**/hotmart-checkout-elements.js", (route) => route.abort());
  await page.goto("/imprime-y-juega/");
  const before = await page.locator("#complemento-title").boundingBox();
  await expect(page.getByTestId("widget-fallback")).toBeVisible({ timeout: 10_000 });
  const after = await page.locator("#complemento-title").boundingBox();
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(140);
});

test("thank-you page never links to files or fires purchase markers", async ({ page }) => {
  await page.goto("/grafismo-fonetico/gracias/");
  const html = await page.content();
  expect(html).not.toMatch(/\.pdf/i);
  expect(html).not.toMatch(/InitiateCheckout|"Purchase"/);
  await expect(page.locator("a[href*='consumer.hotmart.com']").first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
