import { expect, test } from "./fixtures";

/**
 * The home as the hub of two products (docs/specs/home-hub.md): both doors in the first viewport,
 * stable anchors for bios, the header «Productos» menu (native popover) and the contextual sticky
 * bar with the affiliate disclosure.
 */

test("both doors are inside the first viewport, the same size, and lead to stable anchors", async ({
  page,
}) => {
  await page.goto("/");
  const doors = page.locator("a[data-door]");
  await expect(doors).toHaveCount(2);
  await expect(doors.nth(0)).toHaveAttribute("href", "#leer");
  await expect(doors.nth(1)).toHaveAttribute("href", "#bebe");
  const viewport = page.viewportSize();
  const boxes = await Promise.all([doors.nth(0).boundingBox(), doors.nth(1).boundingBox()]);
  for (const box of boxes) {
    expect(box).not.toBeNull();
    // Visible without scrolling (at least the top half of each door).
    expect((box?.y ?? 0) + (box?.height ?? 0) / 2).toBeLessThanOrEqual(viewport?.height ?? 0);
  }
  // Same layout size (offset sizes ignore the entrance transform that may still be running).
  const sizes = await doors.evaluateAll((els) =>
    els.map((el) => [(el as HTMLElement).offsetWidth, (el as HTMLElement).offsetHeight]),
  );
  expect(sizes[0]).toEqual(sizes[1]);
  // The course door is described by the affiliate disclosure, printed right under the doors.
  const describedBy = await doors.nth(1).getAttribute("aria-describedby");
  await expect(page.locator(`#${describedBy}`)).toContainText("Enlace de afiliado");
  await expect(page.locator(`#${describedBy}`)).toBeVisible();
  // Neither door uses the coral purchase style.
  for (const door of await doors.all()) await expect(door.locator(".bg-primary")).toHaveCount(0);
});

test("anchors for bios work on direct entry, below the header", async ({ page }) => {
  for (const anchor of ["leer", "bebe", "grafismo-fonetico", "alimentacion-bebe", "preguntas"]) {
    await page.goto(`/#${anchor}`);
    const target = page.locator(`[id="${anchor}"]`);
    await expect(target).toHaveCount(1);
    await expect
      .poll(() => target.evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 5_000 })
      .toBeLessThan(400);
  }
});

test("header «Productos» opens a menu with both needs and closes on Escape", async ({ page }) => {
  await page.goto("/");
  const trigger = page.locator("header [data-products-trigger]");
  await expect(trigger).toBeVisible();
  const box = await trigger.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  await trigger.click();
  const panel = page.getByRole("navigation", { name: "Menú de productos" });
  await expect(panel).toBeVisible();
  const cards = panel.getByRole("link");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toHaveAttribute("href", "/#leer");
  await expect(cards.nth(1)).toHaveAttribute("href", "/#bebe");
  await expect(cards.nth(1)).toContainText("Recomendado");
  await expect(cards.nth(1)).toContainText("Enlace de afiliado");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  // Choosing a card closes the panel and lands on the chapter.
  await trigger.click();
  await cards.nth(1).click();
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/#bebe$/);
});

test("the header menu is on the hub pages but never on the purchase or post-purchase pages", async ({
  page,
}) => {
  for (const route of ["/"]) {
    await page.goto(route);
    await expect(page.locator("header [data-products-trigger]"), route).toHaveCount(1);
  }
  for (const route of ["/grafismo-fonetico/", "/imprime-y-juega/", "/grafismo-fonetico/gracias/"]) {
    await page.goto(route);
    await expect(page.locator("header [data-products-trigger]"), route).toHaveCount(0);
  }
});

test("phone sticky bar follows the chapter in view and keeps the disclosure next to the course", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  const bar = page.getByTestId("hub-sticky");
  await expect(bar).toHaveCSS("visibility", "hidden");
  await page.locator("#leer h2").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect(bar).toHaveAttribute("data-mode", "reading");
  await expect(bar.locator('a[data-position="sticky"]')).toHaveAttribute("href", /\/grafismo-fonetico\//);
  await page.locator("#bebe h2").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect(bar).toHaveAttribute("data-mode", "feeding");
  await expect(bar.locator("a[data-affiliate]")).toHaveAttribute("rel", /sponsored/);
  await expect(bar).toContainText("Enlace de afiliado: si compras, Pequeverso recibe una comisión");
  await page.locator("#cierre").scrollIntoViewIfNeeded();
  await expect(bar).toHaveAttribute("data-mode", "hidden");
});

test("an anchor jump keeps the header visible and lands the chapter right under it", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator('a[data-door="feeding"]').click();
  await expect(page).toHaveURL(/#bebe$/);
  const header = page.locator('[data-slot="header"]');
  await expect(header).not.toHaveAttribute("data-hidden", "");
  await expect
    .poll(() =>
      page.evaluate(() => {
        // Gap between the visible header and the chapter's first visible content.
        const pill = document.querySelector('[data-slot="header-pill"]')?.getBoundingClientRect();
        const tops = [...document.querySelectorAll<HTMLElement>("#bebe [data-reveal], #bebe h2")]
          .map((el) => el.getBoundingClientRect())
          .filter((rect) => rect.height > 0)
          .map((rect) => rect.top);
        return Math.min(...tops) - (pill?.bottom ?? 0);
      }),
    )
    .toBeLessThan(64);
});

test("purchase and post-purchase footers keep the single-product column", async ({ page }) => {
  for (const route of ["/grafismo-fonetico/", "/imprime-y-juega/", "/grafismo-fonetico/gracias/"]) {
    await page.goto(route);
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("navigation", { name: "Producto", exact: true }), route).toHaveCount(1);
    await expect(footer.locator('a[href="/#bebe"]'), route).toHaveCount(0);
    await expect(footer.locator('a[href="/grafismo-fonetico/#preguntas"]'), route).toHaveCount(1);
  }
  await page.goto("/");
  await expect(page.getByRole("contentinfo").locator('a[href="/#bebe"]')).toHaveCount(1);
});

test("Tab past the last menu card closes the products panel", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const trigger = page.locator("header [data-products-trigger]");
  await trigger.click();
  const panel = page.getByRole("navigation", { name: "Menú de productos" });
  await expect(panel).toBeVisible();
  await panel.getByRole("link").last().focus();
  await page.keyboard.press("Tab");
  await expect(panel).toBeHidden();
});
