/** Documentation photographs only; outside the CI assistant testDir. Never run against a real provider. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const root = resolve(process.env.ASSISTANT_GALLERY_DIR ?? "test-results-assistant/gallery");
const shots = root;
mkdirSync(shots, { recursive: true });
const build = JSON.parse(readFileSync("out-assistant-fixture/build-info.json", "utf8")) as {
  sha: string;
  assistant: string;
};
const producer = readFileSync("tests/assistant/api-revision", "utf8").trim();
if (build.assistant !== "enabled") throw new Error("Use only the isolated assistant fixture export");
test("quality gallery of actual compact interface", async ({ page, context }, info) => {
  const mobile = info.project.name === "mobile";
  await context.route(/^https:\/\/([a-z0-9-]+\.)*facebook\.(com|net)\//, (route) => route.abort());
  await context.addInitScript(() =>
    localStorage.setItem(
      "pv_consent",
      JSON.stringify({
        version: 2,
        analytics: false,
        marketing: false,
        updatedAt: "2026-10-12T00:00:00Z",
      }),
    ),
  );
  await page.goto("/soporte/");
  await page.evaluate(() => document.fonts.ready);
  const launcher = page.getByTestId("assistant-launcher");
  await expect(launcher).toBeVisible();
  if (!mobile)
    await page.screenshot({
      path: `${shots}/01-Desktop-Boton.png`,
      animations: "disabled",
    });
  await launcher.click();
  const panel = page.getByTestId("assistant-panel");
  await expect(panel).toHaveAttribute("data-phase", "ready");
  await expect(
    panel.getByRole("heading", {
      name: "Asistente de Pequeverso",
      exact: true,
    }),
  ).toBeVisible();
  await expect(panel.locator("select")).toHaveCount(0);
  if (!mobile) await expect(panel).toHaveAttribute("data-size", "compact");
  const field = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
  const capture = async (name: string) => {
    await expect(field).toBeInViewport();
    await panel.screenshot({
      path: `${shots}/${mobile ? "mobile-" : "desktop-"}${name}.png`,
      animations: "disabled",
    });
  };
  for (const chip of await panel
    .getByRole("region", { name: "Preguntas para empezar" })
    .getByRole("button")
    .all())
    await expect(chip).toBeInViewport();
  await page.screenshot({
    path: `${shots}/${mobile ? "05-Mobile-Bienvenida" : "02-Desktop-Bienvenida"}.png`,
    animations: "disabled",
  });
  await capture("bienvenida-detalle");
  let release = () => {};
  const gate = new Promise<void>((r) => (release = r));
  await page.route("https://127.0.0.1:8217/api/v1/messages", async (route) => {
    await gate;
    await route.continue();
  });
  await field.fill("¿Cuál es la garantía?");
  await field.press("Enter");
  await expect(panel.getByRole("list").getByText("Pensando…", { exact: true })).toBeVisible();
  if (!mobile)
    await page.screenshot({
      path: `${shots}/04-Desktop-Espera.png`,
      animations: "disabled",
    });
  await capture("espera-detalle");
  release();
  await expect(panel).toHaveAttribute("data-phase", "streaming");
  await expect(panel.getByRole("button", { name: "Detener respuesta" })).toBeVisible();
  await capture("streaming-detalle");
  await expect(panel).toHaveAttribute("data-phase", "completed");
  const transcript = panel.getByRole("list", {
    name: "Conversación con el asistente",
  });
  const scroller = transcript.locator("..");
  const answer = transcript.locator('li > div[lang="es"]').first();
  const sources = panel
    .locator("details")
    .filter({ hasText: /\d+ fuentes?/ })
    .last();
  await sources.locator("summary").click();
  await answer.scrollIntoViewIfNeeded();
  await expect(answer.locator("p").first()).toBeInViewport();
  await expect(sources.getByRole("link").first()).toBeInViewport();
  await page.screenshot({
    path: `${shots}/${mobile ? "06-Mobile-Conversacion" : "03-Desktop-Conversacion"}.png`,
    animations: "disabled",
  });
  await capture("respuesta-fuentes-detalle");
  const products = panel.getByRole("region", { name: "Productos mencionados" });
  const product = products.locator("article").first();
  if (await product.count()) {
    await product.evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect(product.getByRole("heading")).toBeInViewport();
    await capture("producto-resumen-detalle");
    await product.getByRole("link", { name: "Ver opciones de compra" }).scrollIntoViewIfNeeded();
    await expect(product.getByRole("link", { name: "Ver el material" })).toBeInViewport();
    await capture("producto-precio-acciones-detalle");
  }
  await scroller.evaluate((element) => (element.scrollTop = element.scrollHeight));
  await capture("seguimiento-detalle");
  await field.fill("Borrador conservado");
  await panel.getByRole("button", { name: "Minimizar asistente", exact: true }).click();
  await expect(panel).toBeHidden();
  if (!mobile)
    await page.screenshot({
      path: `${shots}/desktop-minimizado-contexto.png`,
      animations: "disabled",
    });
  await launcher.click();
  await expect(field).toHaveValue("Borrador conservado");
  await expect(answer.locator("p").first()).toHaveText(/Según la información/);
  await answer.scrollIntoViewIfNeeded();
  await capture("conversacion-restaurada-detalle");
  await page.unroute("https://127.0.0.1:8217/api/v1/messages");
  await page.route("https://127.0.0.1:8217/api/v1/messages", (route) => route.abort("failed"));
  await field.fill("¿Cómo recibo el material?");
  await field.press("Enter");
  await expect(panel).toHaveAttribute("data-phase", "failed");
  await capture("error-conexion-detalle");
  writeFileSync(
    `${root}/${info.project.name}-receipt.json`,
    `${JSON.stringify(
      {
        build_source: build.sha,
        producer,
        mode: "fixture",
        provider_calls: 0,
        viewport: info.project.use.viewport,
        dpr: 2,
        defaultcompact: !mobile,
        panel_geometry: await panel.boundingBox(),
        states: [
          "welcome",
          "waiting held HTTP request",
          "actual fixture SSE streaming",
          "completed sources",
          "product scroll",
          "followups scroll",
          "minimize restore draft/conversation",
          "aborted network explicit error",
        ],
        production: "disabled",
      },
      null,
      2,
    )}\n`,
  );
});
