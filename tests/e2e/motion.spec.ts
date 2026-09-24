import { expect, test } from "./fixtures";

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

test("no reveal element inside the first viewport is transparent right after load", async ({ page }) => {
  await page.goto("/");
  const transparent = await page.evaluate(() => {
    const fold = window.innerHeight;
    return [...document.querySelectorAll<HTMLElement>("[data-reveal]")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.height > 0 && rect.top >= 0 && rect.bottom <= fold;
      })
      .filter((el) => Number(getComputedStyle(el).opacity) < 1)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}`);
  });
  expect(transparent).toEqual([]);
});

test("fallback path marks only elements below the fold and reveals them on scroll", async ({ page }) => {
  await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS);
    CSS.supports = ((condition: string, value?: string) =>
      /animation-timeline/.test(condition)
        ? false
        : value === undefined
          ? supports(condition)
          : supports(condition, value)) as typeof CSS.supports;
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const reduced = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const count = (selector: string) => page.locator(selector).count();
  if (reduced) {
    await page.waitForTimeout(500);
    expect(await count("[data-reveal-state]")).toBe(0);
    return;
  }
  await expect.poll(() => count("[data-reveal][data-reveal-state='pending']")).toBeGreaterThan(0);
  const pendingAboveFold = await page.evaluate(() => {
    const fold = window.innerHeight;
    return [...document.querySelectorAll<HTMLElement>("[data-reveal-state='pending']")].filter(
      (el) => el.getBoundingClientRect().top < fold,
    ).length;
  });
  expect(pendingAboveFold).toBe(0);
  const last = await page.locator("[data-reveal][data-reveal-state='pending']").last().elementHandle();
  if (!last) throw new Error("expected a pending element");
  // Deferred sections (content-visibility) grow as they render, so keep centring it until it is in
  // view; WebKit's minimal scrollIntoViewIfNeeded leaves it inside the observer's bottom margin.
  await expect
    .poll(async () => {
      await last.evaluate((el) => el.scrollIntoView({ block: "center" }));
      return last.getAttribute("data-reveal-state");
    })
    .toBe("visible");
  await expect.poll(() => last.evaluate((el) => getComputedStyle(el).opacity), { timeout: 3_000 }).toBe("1");
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
  // Embla swallows clicks that land during the snap animation.
  await expect(gallery.locator("[data-state='settled']")).toHaveCount(1);
  await gallery.locator("button[aria-label^='Ampliar']").nth(4).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("age selector swaps the featured worksheet and keeps a single h1", async ({ page }) => {
  await page.goto("/grafismo-fonetico/");
  const heading = page.locator("h1:visible");
  await expect(heading).toHaveCount(1);
  const title = await heading.textContent();
  const featured = page.locator('#hero [data-slot="front"] img');
  const before = await featured.getAttribute("alt");
  const option = page.getByRole("radio", { name: "6–7" });
  await option.click();
  await expect(option).toBeChecked();
  await expect(featured).not.toHaveAttribute("alt", before ?? "");
  await expect(page.locator("h1:visible")).toHaveCount(1);
  await expect(heading).toHaveText(title ?? "");
  await expect(page.locator("#comprar")).toHaveCount(1);
  expect(page.url()).not.toContain("?");
});

test("sticky bar stays hidden while the gallery zoom dialog is open", async ({ page }) => {
  await page.goto("/grafismo-fonetico/#paginas");
  const bar = page.getByTestId("sticky-cta");
  const offscreen = () =>
    bar.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.height === 0 || rect.top >= window.innerHeight;
    });
  await page.locator("button[aria-label^='Ampliar']").first().click();
  await expect(page.locator("dialog[open]")).toBeVisible();
  await expect.poll(offscreen, { timeout: 3_000 }).toBe(true);
  await page.keyboard.press("Escape");
});
