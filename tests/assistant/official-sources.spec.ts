import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { assistantConfig } from "../../config/assistant.ts";

const API = "https://127.0.0.1:8217";
const ANSWER = "Puedes consultar estas guías generales de Hotmart.";
const SOURCES = assistantConfig.approvedSourceUrls.map((url, index) => ({
  id: `hotmart:${["209033897", "360061973392", "9312940657933"][index]}`,
  title: [
    "Hotmart · entrega digital",
    "Hotmart · solicitud de reembolso",
    "Hotmart · ayuda sobre el producto",
  ][index],
  url,
}));

test.use({ deviceScaleFactor: 2 });

for (const malicious of [false, true]) {
  test(`${malicious ? "unapproved official citations never render" : "exact official citations survive minimizing"} without automatic requests`, async ({
    page,
    context,
  }, info) => {
    // Synthetic presentation evidence: session/CSRF and the fixture run remain real HTTP/SSE;
    // citation enrichment below does not claim the backend fetched or persisted these articles.
    const offsiteRequests: string[] = [];
    const generations: string[] = [];
    const sessions: string[] = [];
    page.on("request", (request) => {
      if (request.url().startsWith("https://help.hotmart.com")) offsiteRequests.push(request.url());
      if (request.url() === `${API}/api/v1/messages` && request.method() === "POST")
        generations.push(request.url());
      if (request.url() === `${API}/api/v1/session`) sessions.push(request.url());
    });
    await context.route(/^https:\/\/help\.hotmart\.com\//, (route) => route.abort());
    await context.route(/^https:\/\/([a-z0-9-]+\.)*facebook\.(com|net)\//, (route) => route.abort());
    await context.addInitScript(() =>
      localStorage.setItem(
        "pv_consent",
        JSON.stringify({ version: 2, analytics: false, marketing: false, updatedAt: "2026-10-13T00:00:00Z" }),
      ),
    );
    await page.route(`${API}/api/v1/messages`, async (route) => {
      expect(route.request().headers()["x-csrf-token"]).toBeTruthy();
      const response = await route.fetch();
      let sentText = false;
      const body = (await response.text())
        .split("\n")
        .map((line) => {
          if (!line.startsWith("data: ")) return line;
          const event = JSON.parse(line.slice(6));
          if (event.type === "message.delta") {
            event.text = sentText ? "" : ANSWER;
            sentText = true;
          }
          if (event.type === "message.completed") {
            event.message = {
              ...event.message,
              content: ANSWER,
              products: [],
              resources: [],
              links: [],
              follow_ups: [],
              sources: malicious
                ? [
                    {
                      id: "unapproved-query",
                      title: "Referencia no permitida",
                      url: `${SOURCES[0]?.url}?next=https://evil.example`,
                    },
                    {
                      id: "unapproved-path",
                      title: "Artículo no permitido",
                      url: "https://help.hotmart.com/es/article/123/unknown",
                    },
                    {
                      id: "unapproved-fragment",
                      title: "Fragmento no permitido",
                      url: `${SOURCES[1]?.url}#fragment`,
                    },
                  ]
                : SOURCES,
            };
          }
          return `data: ${JSON.stringify(event)}`;
        })
        .join("\n");
      await route.fulfill({ response, body });
    });
    await page.goto("/soporte/");
    const launcher = page.getByTestId("assistant-launcher");
    const panel = page.getByTestId("assistant-panel");
    await launcher.click();
    await expect(panel).toHaveAttribute("data-phase", "ready");
    const composer = panel.getByRole("textbox", { name: "Escribe tu pregunta" });
    await composer.fill("¿Dónde puedo consultar los procedimientos generales de Hotmart?");
    await composer.press("Enter");
    await expect(panel).toHaveAttribute("data-phase", "completed");
    await expect(panel.getByText(ANSWER, { exact: true })).toBeVisible();
    const sources = panel.locator("details").filter({ hasText: "3 fuentes" });
    if (!malicious) {
      await sources.locator("summary").click();
      await expect(sources.getByRole("link")).toHaveCount(3);
      for (const source of SOURCES) {
        if (!source.title) throw new Error("Each fixture article needs an explicit title");
        await expect(sources.getByRole("link", { name: source.title, exact: true })).toHaveAttribute(
          "href",
          source.url,
        );
      }
      await expect(sources.getByText("Hotmart · procedimiento general", { exact: true })).toHaveCount(3);
    } else {
      await expect(panel.locator("details")).toHaveCount(0);
    }
    await expect(panel.getByText("Referencia no permitida")).toHaveCount(0);
    await expect(panel.getByText("Artículo no permitido")).toHaveCount(0);
    await expect(panel.getByText("Fragmento no permitido")).toHaveCount(0);
    await composer.fill("Borrador conservado");
    await panel.getByRole("button", { name: "Minimizar asistente", exact: true }).click();
    await launcher.click();
    await expect(panel.getByText(ANSWER, { exact: true })).toBeVisible();
    await expect(composer).toHaveValue("Borrador conservado");
    if (!malicious) await expect(sources.getByRole("link")).toHaveCount(3);
    else await expect(panel.locator("details")).toHaveCount(0);
    expect(generations).toHaveLength(1);
    expect(sessions).toHaveLength(1);
    expect(offsiteRequests).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (!malicious && ["chromium-desktop", "chromium-mobile"].includes(info.project.name)) {
      await sources.scrollIntoViewIfNeeded();
      mkdirSync("test-results-assistant/screenshots", { recursive: true });
      await panel.screenshot({
        path: `test-results-assistant/screenshots/${info.project.name}-official-sources.png`,
        animations: "disabled",
      });
    }
  });
}
