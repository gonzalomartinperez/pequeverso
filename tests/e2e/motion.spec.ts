import { expect, test } from "@playwright/test";

test("reveal elements are visible immediately under reduced motion", async ({ page }) => {
  await page.goto("/");
  const reduced = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  test.skip(!reduced, "only meaningful in the reduced-motion project");
  const hidden = await page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
        (el) => getComputedStyle(el).opacity === "0",
      ).length,
  );
  expect(hidden).toBe(0);
});

test("no autoplaying video anywhere on the landing", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  await expect(page.locator("video[autoplay]")).toHaveCount(0);
});

test("videos are click-to-play with controls and a text alternative", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  const buttons = page.locator("button[aria-label^='Reproducir']");
  await expect(buttons).toHaveCount(4);
  await expect(page.locator("video")).toHaveCount(0);
  await buttons.first().scrollIntoViewIfNeeded();
  await buttons.first().click();
  const video = page.locator("video");
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).toHaveAttribute("playsinline", "");
  await expect(page.locator("figcaption strong").first()).not.toBeEmpty();
});

test("page gallery: arrows, dots, keyboard and zoom dialog", async ({ page }) => {
  await page.goto("/grafismo-fonetico/#paginas");
  const gallery = page.getByRole("region", { name: "Páginas reales del kit" });
  await expect(gallery.getByText("1 de 20")).toBeVisible();
  await gallery.getByRole("button", { name: "Página siguiente" }).click();
  await expect(gallery.getByText("2 de 20")).toBeVisible();
  await gallery.getByRole("tab", { name: "Ir a la página 5" }).click();
  await expect(gallery.getByText("5 de 20")).toBeVisible();
  await gallery.locator("button[aria-label^='Ampliar']").nth(4).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
