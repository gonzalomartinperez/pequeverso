import { expect, test } from "./fixtures";

/** Routes that mount the interactive pieces (overridable while a page is being built). */
const PLAYGROUND_PATH = process.env.PLAYGROUND_PATH ?? "/grafismo-fonetico/";
const WALL_PATH = process.env.WALL_PATH ?? "/";

test.describe("syllable playground", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLAYGROUND_PATH);
    // Tiles clicked before hydration do nothing; wait for the island.
    await page.waitForLoadState("networkidle");
  });

  test("tiles are large buttons; a wrong tile shakes without advancing, the right order completes the word", async ({
    page,
  }) => {
    const game = page.locator('[data-slot="syllable-playground"]').first();
    await game.scrollIntoViewIfNeeded();
    const tiles = game.locator('[data-slot="syllable-tile"]');
    const count = await tiles.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (const tile of await tiles.all()) {
      const box = await tile.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(64);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(64);
    }
    // Starting with the second syllable is a miss: nothing is placed, the live region explains.
    await game.locator('[data-slot="syllable-tile"][data-index="1"]').click();
    await expect(game.getByText(`0 de ${count}`)).toHaveCount(1);
    await expect(game.locator("[aria-live='polite']")).not.toBeEmpty();

    for (let index = 0; index < count; index += 1) {
      await game.locator(`[data-slot="syllable-tile"][data-index="${index}"]`).click();
    }
    await expect(game.locator("[data-done]").first()).toBeVisible();
    await expect(game.getByText(`${count} de ${count}`)).toHaveCount(1);
    for (const tile of await tiles.all()) await expect(tile).toHaveAttribute("aria-disabled", "true");
    // The first word has three syllables, so the tiles never start solved.
    expect(await tiles.first().getAttribute("data-index")).not.toBe("0");
  });

  test("works from the keyboard and the word chips swap the word and its real page", async ({ page }) => {
    const game = page.locator('[data-slot="syllable-playground"]').first();
    await game.scrollIntoViewIfNeeded();
    const tile = game.locator('[data-slot="syllable-tile"][data-index="0"]');
    await tile.focus();
    await page.keyboard.press("Enter");
    await expect(tile).toHaveAttribute("aria-disabled", "true");

    const chips = game.getByRole("group", { name: "Elige una palabra" }).getByRole("button");
    test.skip((await chips.count()) < 2, "only one word configured");
    const image = game.locator("img:visible").first();
    const before = await image.getAttribute("alt");
    const second = chips.nth(1);
    await second.focus();
    await page.keyboard.press("Space");
    await expect(second).toHaveAttribute("aria-pressed", "true");
    await expect(game.locator("img:visible").first()).not.toHaveAttribute("alt", before ?? "");
    await expect(game.getByText(/^0 de \d+$/)).toHaveCount(1);
  });
});

test("page wall drifts without widening the page and can be paused", async ({ page }) => {
  await page.goto(WALL_PATH);
  const wall = page.locator('[data-slot="page-wall"]').first();
  await wall.scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(wall.getByRole("list")).toHaveCount(1);
  const reduced = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const toggle = wall.getByRole("button", { name: "Pausar el desplazamiento" });
  if (reduced) {
    await expect(toggle).toBeHidden();
    return;
  }
  await page.waitForLoadState("networkidle");
  await toggle.click();
  await expect(wall).toHaveAttribute("data-paused", "");
  await expect(wall.getByRole("button", { name: "Reanudar el desplazamiento" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
