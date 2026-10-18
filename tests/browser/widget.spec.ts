import { expect, test } from "./fixtures";

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

/**
 * Simulated Hotmart library: `mount()` appends an iframe with Hotmart's inline `min-width: 320px`
 * and counts calls, so layout, single mount and navigation can be checked without a purchase.
 */
const FAKE_WIDGET = `window.__hmMounts=0;window.checkoutElements={init:function(){return{mount:function(s){window.__hmMounts++;var c=document.querySelector(s);var f=document.createElement("iframe");f.title="Hotmart";f.style.cssText="display:block;width:100%;min-width:320px;height:200px;border:0";f.srcdoc="<button>Sí</button><button>No</button>";c.appendChild(f);}}}};`;

async function stubWidget(page: import("@playwright/test").Page) {
  await page.route("**/hotmart-checkout-elements.js", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_WIDGET }),
  );
}

test("simulated widget mounts once, marks the slot ready and never shows the fallback", async ({ page }) => {
  await stubWidget(page);
  await page.goto("/imprime-y-juega/?downsell=1");
  const container = page.locator("#hotmart-sales-funnel");
  await expect(container.locator("iframe")).toHaveCount(1);
  await expect(container).toHaveAttribute("data-status", "ready");
  expect(await page.evaluate(() => (window as unknown as { __hmMounts: number }).__hmMounts)).toBe(1);
  await expect(page.locator('script[src*="hotmart-checkout-elements.js"]')).toHaveCount(1);
  await expect(page.getByTestId("widget-fallback")).toHaveCount(0);
});

test("decision links keep Hotmart's query untouched and only add the anchor", async ({ page }) => {
  await stubWidget(page);
  const query = "?downsell=1&hsid=abc123&off=xyz&sck=pv-test";
  await page.goto(`/imprime-y-juega/${query}`);
  await page.locator("main a[data-decision-link]:visible").first().click();
  await expect(page.locator("#gfp-decision")).toBeFocused();
  const url = new URL(page.url());
  expect(url.search).toBe(query);
  expect(url.hash).toBe("#gfp-decision");
});

test("back navigation returns to a single mounted widget", async ({ page }) => {
  await stubWidget(page);
  await page.goto("/imprime-y-juega/");
  await expect(page.locator("#hotmart-sales-funnel iframe")).toHaveCount(1);
  await page.locator("footer").getByRole("link", { name: "Soporte y contacto" }).click();
  await expect(page).toHaveURL(/\/soporte\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/imprime-y-juega\/$/);
  await expect(page.locator("#hotmart-sales-funnel")).toHaveCount(1);
  await expect(page.locator("#hotmart-sales-funnel iframe")).toHaveCount(1);
});

test("simulated widget fits every width without overflow or layout shift", async ({ page }) => {
  test.skip(!test.info().project.name.endsWith("-1440"), "sweeps its own widths");
  await stubWidget(page);
  for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/imprime-y-juega/");
    const frame = page.locator("#hotmart-sales-funnel iframe");
    await expect(frame).toHaveCount(1);
    await frame.scrollIntoViewIfNeeded();
    const box = await frame.boundingBox();
    expect(box, `@${width}`).not.toBeNull();
    if (box) {
      expect(box.x, `@${width} left edge`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `@${width} right edge`).toBeLessThanOrEqual(width + 0.5);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `@${width} horizontal overflow`).toBe(0);
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let sum = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
              if (!entry.hadRecentInput) sum += entry.value;
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(sum), 300);
        }),
    );
    expect(cls, `@${width} CLS`).toBeLessThanOrEqual(0.1);
  }
});
