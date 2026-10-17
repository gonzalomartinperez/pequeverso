import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

const API = "https://127.0.0.1:8217";
const SHOTS = "test-results-assistant/affiliate";
mkdirSync(SHOTS, { recursive: true });

test.beforeEach(async ({ context }) => {
  await context.route(/^https:\/\/([a-z0-9-]+\.)*facebook\.(com|net)\//, (route) => route.abort());
});

test("affiliate course has its own card, disclosure and safe action, and survives history recovery", async ({
  page,
}, info) => {
  let generations = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url() === `${API}/api/v1/messages`) generations++;
  });
  await page.goto("/");
  await page.getByTestId("assistant-launcher").click();
  const panel = page.getByTestId("assistant-panel");
  await expect(panel).toHaveAttribute("data-phase", "ready");
  const input = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
  await input.fill("¿Qué enseña la Guía de Alimentación para Bebés?");
  await input.press("Enter");
  await expect(panel).toHaveAttribute("data-phase", "completed");
  const card = panel.getByRole("article", { name: "Guía de Alimentación para Bebés" });
  await expect(card).toBeVisible();
  await expect(card.getByText("Recomendación de afiliado", { exact: true })).toBeVisible();
  await expect(card.getByText("Curso en video", { exact: true })).toBeVisible();
  await expect(card.getByText("Consulta el precio vigente en Hotmart.", { exact: true })).toBeVisible();
  await expect(card.getByText(/Pequeverso recibe una comisión/)).toBeVisible();
  await expect(card).not.toContainText("US$");
  await expect(card).not.toContainText(/\d+ destacados?/);
  const action = card.getByRole("link", { name: /Ver la guía en Hotmart/ });
  await expect(action).toHaveAttribute("href", "/alimentacion-bebe/");
  await expect(action).toHaveAttribute("target", "_blank");
  await expect(action).toHaveAttribute("rel", "sponsored noopener");
  await expect(action).toHaveAccessibleName(/se abre en una pestaña nueva/);
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-affiliate-card.png`, animations: "disabled" });
  await page.reload();
  await page.getByTestId("assistant-launcher").click();
  await expect(panel).toHaveAttribute("data-phase", "ready");
  await expect(panel.getByRole("article", { name: "Guía de Alimentación para Bebés" })).toHaveCount(1);
  expect(generations).toBe(1);
});

test("comparison distinguishes course, printable kit and unknown affiliate price", async ({ page }, info) => {
  await page.goto("/");
  await page.getByTestId("assistant-launcher").click();
  const panel = page.getByTestId("assistant-panel");
  await expect(panel).toHaveAttribute("data-phase", "ready");
  const input = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
  await input.fill("Compara Grafismo Fonético con la Guía de Alimentación para Bebés.");
  await input.press("Enter");
  await expect(panel).toHaveAttribute("data-phase", "completed");
  await expect(panel.getByRole("article", { name: "Grafismo Fonético", exact: true })).toHaveCount(1);
  await expect(panel.getByRole("article", { name: "Guía de Alimentación para Bebés" })).toHaveCount(1);
  const comparison = panel.getByRole("table", { name: "Comparación", exact: true });
  await expect(comparison.getByRole("rowheader", { name: "Formato", exact: true })).toBeVisible();
  await expect(comparison.getByRole("cell", { name: "Curso en video", exact: true })).toBeVisible();
  await expect(
    comparison.getByRole("cell", { name: "Recomendación de afiliado", exact: true }),
  ).toBeVisible();
  await expect(
    comparison.getByRole("cell", { name: "Consulta el precio vigente en Hotmart.", exact: true }),
  ).toBeVisible();
  await expect(input).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await comparison.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-comparison.png`, animations: "disabled" });
});
