import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

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
  "/esta-no-existe/",
];

for (const route of routes) {
  test(`axe WCAG 2.2 AA: ${route}`, async ({ page }) => {
    // Contrast is evaluated on settled styles: no reveal/tilt transitions mid-flight.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("[data-reveal]")) el.classList.add("is-visible");
    });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .exclude("#hotmart-sales-funnel")
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      JSON.stringify(
        serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        null,
        2,
      ),
    ).toEqual([]);
  });
}

test("visible headings form a single h1 per page (offer modes included)", async ({ page }) => {
  for (const route of ["/imprime-y-juega/", "/imprime-y-juega/?downsell=1"]) {
    await page.goto(route);
    await expect(page.locator("h1:visible")).toHaveCount(1);
  }
});

test("focus is visible and not obscured on the landing CTA path", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  await page.keyboard.press("Tab"); // skip link
  await expect(page.locator("a[href='#contenido']")).toBeFocused();
  let reached = false;
  for (let i = 0; i < 40 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.matches("a[data-checkout]") ?? false);
  }
  expect(reached, "a checkout CTA must be reachable by keyboard within 40 tabs").toBe(true);
  const box = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    const header = document.querySelector("header");
    const inHeader = header?.contains(el) ?? false;
    return {
      top: rect.top,
      headerBottom: header?.getBoundingClientRect().bottom ?? 0,
      inHeader,
      visible: rect.width > 0 && rect.height > 0,
    };
  });
  expect(box.visible).toBe(true);
  if (!box.inHeader) expect(box.top).toBeGreaterThanOrEqual(box.headerBottom - 1);
});

test("interactive targets meet the 24px minimum", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("a, button, summary")]
      .filter((el) => el.offsetParent !== null && !el.closest("p"))
      .map((el) => ({
        text: el.textContent?.trim().slice(0, 30),
        w: el.getBoundingClientRect().width,
        h: el.getBoundingClientRect().height,
      }))
      .filter((r) => r.w > 0 && r.h > 0 && (r.w < 24 || r.h < 24)),
  );
  expect(small).toEqual([]);
});
