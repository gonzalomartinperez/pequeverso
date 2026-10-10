import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const SHOTS = "test-results-assistant/preview";
mkdirSync(SHOTS, { recursive: true });

/** Reproducible preview of the enabled, unpublishable local fixture build. */
test("captures the local assistant preview", async ({ page, context }, info) => {
  test.skip(
    !["chromium-desktop", "chromium-mobile"].includes(info.project.name),
    "preview delivery uses one desktop and one phone; behavior is verified across all engines",
  );
  await context.route(/^https:\/\/([a-z0-9-]+\.)*facebook\.(com|net)\//, (route) => route.abort());
  await context.addInitScript(() => {
    window.localStorage.setItem(
      "pv_consent",
      JSON.stringify({ version: 2, analytics: false, marketing: false, updatedAt: "2026-10-10T00:00:00Z" }),
    );
  });
  const mobile = info.project.name === "chromium-mobile";
  if (!mobile) await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/soporte/");
  const launcher = page.getByTestId("assistant-launcher");
  await expect(launcher).toBeVisible();
  if (!mobile) await page.screenshot({ path: `${SHOTS}/01-Desktop-Boton.png`, animations: "disabled" });
  await launcher.click();
  const panel = page.getByTestId("assistant-panel");
  await expect(panel).toHaveAttribute("data-phase", "ready");
  if (!mobile) await panel.getByRole("button", { name: "Ampliar panel" }).click();
  await expect(panel.getByRole("region", { name: "Preguntas para empezar" })).toBeVisible();
  await page.screenshot({
    path: `${SHOTS}/${mobile ? "05-Mobile-Bienvenida" : "02-Desktop-Bienvenida"}.png`,
    animations: "disabled",
  });
  // Hold the HTTP request, rather than fabricating a provider phase or waiting percentage.
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("https://127.0.0.1:8217/api/v1/messages", async (route) => {
    await gate;
    await route.continue();
  });
  const field = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
  await field.fill("¿Qué incluye Grafismo Fonético y cómo se imprime?");
  await field.press("Enter");
  await expect(panel.getByRole("list").getByText("Pensando…", { exact: true })).toBeVisible();
  if (!mobile) await page.screenshot({ path: `${SHOTS}/04-Desktop-Espera.png`, animations: "disabled" });
  release();
  await expect(panel).toHaveAttribute("data-phase", "completed");
  await panel
    .getByRole("list")
    .locator("..")
    .evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
  const sources = panel
    .locator("details")
    .filter({ hasText: /\d+ fuentes?/ })
    .last();
  await expect(sources).toBeVisible();
  await sources.locator("summary").click();
  await page.screenshot({
    path: `${SHOTS}/${mobile ? "06-Mobile-Conversacion" : "03-Desktop-Conversacion"}.png`,
    animations: "disabled",
  });
});
