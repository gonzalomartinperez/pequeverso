import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Request, test } from "@playwright/test";

const API = "https://127.0.0.1:8217";
const SHOTS = "test-results-assistant/screenshots";
mkdirSync(SHOTS, { recursive: true });

const launcher = (page: Page) => page.getByTestId("assistant-launcher");
const panel = (page: Page) => page.getByTestId("assistant-panel");
const composer = (page: Page) => panel(page).getByRole("textbox", { name: "Escribe tu pregunta" });
const isMobile = (name: string) => name.includes("mobile");
/**
 * Where interactive tests start. Headless WebKit on Linux paints the hub and landing's decorative
 * layers at about 1 frame per second in software (Chromium about 12; both 59 on /soporte/, measured
 * 2026-10-05), which starves Playwright's stability checks. WebKit therefore exercises the assistant
 * on /soporte/, which is also an assistant route; Chromium and Firefox cover the hub and landing.
 */
const start = (project: string, path: string) => (project.startsWith("webkit") ? "/soporte/" : path);

function apiCalls(page: Page): Request[] {
  const calls: Request[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith(API)) calls.push(request);
  });
  return calls;
}

async function openPanel(page: Page) {
  await launcher(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(panel(page)).toHaveAttribute("data-phase", /ready|completed|expired/);
}

async function ask(page: Page, question: string) {
  await composer(page).fill(question);
  await composer(page).press("Enter");
}

async function shot(page: Page, project: string, name: string) {
  await page.screenshot({ path: `${SHOTS}/${project}-${name}.png` });
}

test.describe("native assistant (enabled verification build, fixture API)", () => {
  test("stays idle until opened and only appears on hub, product and support pages", async ({ page }) => {
    const calls = apiCalls(page);
    for (const path of ["/", "/grafismo-fonetico/", "/soporte/"]) {
      await page.goto(path);
      await expect(launcher(page)).toBeVisible();
    }
    for (const path of ["/imprime-y-juega/", "/grafismo-fonetico/gracias/", "/privacidad/", "/terminos/"]) {
      await page.goto(path);
      await expect(launcher(page)).toBeHidden();
    }
    await page.waitForTimeout(500);
    expect(calls, "no session or API call before the visitor opens the assistant").toHaveLength(0);
  });

  test("answers a question with a streamed, grounded answer", async ({ page }, info) => {
    const calls = apiCalls(page);
    await page.goto(start(info.project.name, "/grafismo-fonetico/"));
    await openPanel(page);
    expect(calls.filter((c) => c.url().endsWith("/api/v1/session"))).toHaveLength(1);
    await expect(panel(page).getByRole("region", { name: "Preguntas para empezar" })).toBeVisible();
    await shot(page, info.project.name, "empty");
    await ask(page, "¿Qué incluye el kit?");
    await expect(panel(page)).toHaveAttribute("data-phase", /submitting|streaming/);
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    const answer = panel(page)
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: "Asistente" }) })
      .last();
    expect(((await answer.locator("p").first().textContent()) ?? "").trim().length).toBeGreaterThan(20);
    const purchase = panel(page).getByRole("link", { name: "Ver opciones de compra" }).first();
    if (await purchase.count())
      await expect(purchase).toHaveAttribute("href", /^\/grafismo-fonetico\/#comprar$/);
    // A price is shown only with its confirmation date; otherwise the honest fallback appears.
    const confirmed = await panel(page)
      .getByText(/Precio confirmado el/)
      .count();
    const withheld = await panel(page)
      .getByText("Consulta el precio vigente en la página del material")
      .count();
    if (await panel(page).getByRole("article").count()) expect(confirmed + withheld).toBeGreaterThan(0);
    const message = calls.find((c) => c.url().endsWith("/api/v1/messages"));
    expect(message?.headers()["idempotency-key"]).toMatch(/^[A-Za-z0-9_-]{8,128}$/);
    expect(message?.headers()["x-csrf-token"]).toBeTruthy();
    expect(message?.url()).not.toContain("csrf");
    // The API session is a production-shaped cookie: __Host- prefix, Secure, HttpOnly, Lax, host-only.
    // (Cookies ignore ports, so on loopback the store's host shares the jar; production hosts differ.)
    const cookies = await page.context().cookies(API);
    const session = cookies.find((cookie) => cookie.name === "__Host-pv_assistant");
    expect(session).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      domain: "127.0.0.1",
    });
    expect(await page.evaluate(() => document.cookie)).not.toContain("pv_assistant");
    await shot(page, info.project.name, "answer");
  });

  test("stops a streaming answer", async ({ page }, info) => {
    await page.goto(start(info.project.name, "/"));
    await openPanel(page);
    await ask(page, "¿Cómo se usa el material en casa, paso a paso?");
    await expect(panel(page)).toHaveAttribute("data-phase", "streaming");
    // Keyboard activation (a real user path) avoids WebKit's frame-stability wait while the page renders.
    await panel(page).getByRole("button", { name: "Detener respuesta" }).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toHaveAttribute("data-phase", "cancelled");
    await expect(panel(page).getByText("Detuviste la respuesta.")).toBeVisible();
    await expect(composer(page)).toBeEnabled();
  });

  test("minimizing keeps the conversation and lets an authorized answer finish", async ({ page }, info) => {
    await page.goto(start(info.project.name, "/"));
    await openPanel(page);
    await ask(page, "¿Para qué edades es?");
    await expect(panel(page)).toHaveAttribute("data-phase", /submitting|streaming/);
    await panel(page).getByRole("button", { name: "Minimizar asistente" }).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toBeHidden();
    await expect(launcher(page)).toBeFocused();
    await expect(launcher(page)).toHaveAttribute("aria-label", /respuesta nueva/);
    // Hidden panel content is not reachable with the keyboard.
    for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        document.querySelector("#pv-assistant-panel")?.contains(document.activeElement),
      ),
    ).toBe(false);
    await launcher(page).click();
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    await expect(panel(page).getByText("¿Para qué edades es?")).toBeVisible();
    await expect(launcher(page)).not.toHaveAttribute("aria-label", /respuesta nueva/);
  });

  test("keyboard: Enter sends, Shift+Enter adds a line, Escape minimizes and restores focus", async ({
    page,
  }, info) => {
    test.skip(isMobile(info.project.name), "hardware keyboard flow");
    await page.goto(start(info.project.name, "/"));
    await launcher(page).focus();
    await page.keyboard.press("Enter");
    await expect(composer(page)).toBeFocused();
    await page.keyboard.type("Hola");
    await page.keyboard.press("Shift+Enter");
    await page.keyboard.type("¿qué incluye?");
    await expect(composer(page)).toHaveValue("Hola\n¿qué incluye?");
    await page.keyboard.press("Enter");
    await expect(composer(page)).toHaveValue("");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(launcher(page)).toBeFocused();
  });

  test("expands in the page and restores", async ({ page }, info) => {
    test.skip(isMobile(info.project.name), "phones always use the near-full-screen surface");
    await page.goto(start(info.project.name, "/grafismo-fonetico/"));
    await openPanel(page);
    // Compact: a named, non-modal region; the page stays usable and its motion keeps running.
    await expect(page.getByRole("region", { name: "Asistente Pequeverso" })).toBeVisible();
    expect(await page.evaluate(() => Boolean(document.querySelector("main")?.closest("[inert]")))).toBe(
      false,
    );
    await expect(page.locator("html")).not.toHaveAttribute("data-motion-hold", "");
    await shot(page, info.project.name, "compact");
    await panel(page).getByRole("button", { name: "Ampliar panel" }).click();
    await expect(panel(page)).toHaveAttribute("data-size", "expanded");
    // Expanded: a modal dialog; background inert, page motion held, Tab stays inside.
    await expect(page.getByRole("dialog", { name: "Asistente Pequeverso" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(await page.evaluate(() => Boolean(document.querySelector("main")?.closest("[inert]")))).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("data-motion-hold", "");
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() =>
          document.querySelector("#pv-assistant-panel")?.contains(document.activeElement),
        ),
      ).toBe(true);
    }
    const box = await panel(page).boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(800);
    await ask(page, "¿Qué incluye el kit?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    await shot(page, info.project.name, "expanded");
    await panel(page).getByRole("button", { name: "Reducir panel" }).click();
    await expect(panel(page)).toHaveAttribute("data-size", "compact");
    expect(await page.evaluate(() => Boolean(document.querySelector("main")?.closest("[inert]")))).toBe(
      false,
    );
    await expect(page.locator("html")).not.toHaveAttribute("data-motion-hold", "");
  });

  test("uses a near-full-screen surface on phones, portrait and landscape", async ({ page }, info) => {
    test.skip(!isMobile(info.project.name), "phone geometry");
    await page.goto(start(info.project.name, "/grafismo-fonetico/"));
    await openPanel(page);
    await ask(page, "¿Qué incluye el kit?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    const viewport = page.viewportSize();
    const box = await panel(page).boundingBox();
    expect(box?.width).toBeCloseTo(viewport?.width ?? 0, 0);
    expect(box?.height ?? 0).toBeGreaterThan((viewport?.height ?? 0) * 0.9);
    await expect(page.getByRole("dialog", { name: "Asistente Pequeverso" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    await expect(page.locator("html")).toHaveAttribute("data-motion-hold", "");
    await shot(page, info.project.name, "portrait");
    if (viewport) await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await expect(panel(page)).toBeVisible();
    const landscape = await panel(page).boundingBox();
    expect(landscape?.height ?? 0).toBeGreaterThan((viewport?.width ?? 0) * 0.85);
    await shot(page, info.project.name, "landscape");
    await panel(page).getByRole("button", { name: "Minimizar asistente" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-motion-hold", "");
    expect(await page.evaluate(() => Boolean(document.querySelector("main")?.closest("[inert]")))).toBe(
      false,
    );
    await expect(launcher(page)).toBeFocused();
  });

  test("client navigation and a reload keep the conversation", async ({ page }, info) => {
    const calls = apiCalls(page);
    await page.goto(start(info.project.name, "/"));
    await openPanel(page);
    await ask(page, "¿Qué incluye el kit?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    const productLink = panel(page).getByRole("link", { name: "Ver el material" }).first();
    if (await productLink.count()) {
      await productLink.click();
      await expect(page).toHaveURL(/\/grafismo-fonetico\/$/);
      if (isMobile(info.project.name)) {
        // Keyboard activation: the landing may still be painting its decorative layers.
        await launcher(page).focus();
        await page.keyboard.press("Enter");
      }
      await expect(panel(page).getByText("¿Qué incluye el kit?")).toBeVisible();
      expect(calls.filter((c) => c.url().endsWith("/api/v1/session"))).toHaveLength(1);
    }
    // A fresh document load (reload, or a full load of the start page in WebKit, see `start`).
    if (info.project.name.startsWith("webkit")) await page.goto(start(info.project.name, "/"));
    else await page.reload();
    await openPanel(page);
    // The API restores the history from its host-only session cookie (cross-origin, same-site).
    await expect(panel(page).getByText("¿Qué incluye el kit?")).toBeVisible();
  });

  test("answers in English when the visitor writes in English", async ({ page }, info) => {
    test.skip(info.project.name !== "chromium-desktop", "language is API behaviour; one engine is enough");
    await page.goto(start(info.project.name, "/"));
    await openPanel(page);
    await ask(page, "What is included in the kit and how do I print it?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    await expect(panel(page).locator('[lang="en"]').first()).toBeVisible();
  });

  test("deletes the conversation only after confirmation", async ({ page }, info) => {
    const calls = apiCalls(page);
    await page.goto(start(info.project.name, "/"));
    await openPanel(page);
    await ask(page, "¿Para qué edades es?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    await panel(page).getByRole("button", { name: "Nueva conversación" }).click();
    const confirm = panel(page).getByRole("dialog", { name: "¿Empezar de nuevo?" });
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Cancelar" }).click();
    await expect(panel(page).getByText("¿Para qué edades es?")).toBeVisible();
    await panel(page).getByRole("button", { name: "Nueva conversación" }).click();
    await panel(page).getByRole("button", { name: "Borrar" }).click();
    await expect(panel(page).getByRole("region", { name: "Preguntas para empezar" })).toBeVisible();
    expect(calls.some((c) => c.method() === "DELETE" && c.url().endsWith("/api/v1/session"))).toBe(true);
  });

  test("long unbroken text and 200 % text size do not overflow", async ({ page }, info) => {
    await page.goto(start(info.project.name, "/"));
    await openPanel(page);
    // Scaled after opening: at a forced 200 % root size the store's own hero overflows on phones
    // (a page issue outside the assistant); this test judges the assistant surface only.
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await ask(page, `¿Sirve este enlace https://pequeverso.com/${"muy-largo-".repeat(30)} para comprar?`);
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    const overflow = await panel(page).evaluate((element) =>
      [...element.querySelectorAll("ol, p, li, a, button")]
        .filter(
          (node) =>
            node.scrollWidth > node.clientWidth + 1 &&
            getComputedStyle(node).overflowX !== "auto" &&
            !node.classList.contains("sr-only") &&
            getComputedStyle(node).display !== "inline",
        )
        .map((node) => `${node.tagName.toLowerCase()}.${node.className}`.slice(0, 120)),
    );
    expect(overflow).toEqual([]);
    const box = await panel(page).boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 1);
    await shot(page, info.project.name, "zoom-long-text");
  });

  test("an unreachable API leaves the store working and recovers on request", async ({ page }, info) => {
    await page.route(`${API}/**`, (route) => route.abort());
    await page.goto(start(info.project.name, "/grafismo-fonetico/"));
    await launcher(page).click();
    await expect(panel(page).getByText("No pudimos conectar con el asistente.")).toBeVisible();
    await panel(page).getByRole("button", { name: "Minimizar asistente" }).click();
    // The store keeps working: its own navigation (and, on the landing, the checkout link) is intact.
    await expect(page.locator("main a[href]").first()).toBeAttached();
    if (!info.project.name.startsWith("webkit"))
      await expect(page.locator('a[href^="https://pay.hotmart.com/"]').first()).toBeAttached();
    await page.unroute(`${API}/**`);
    await launcher(page).click();
    await panel(page).getByRole("button", { name: "Reintentar conexión" }).click();
    await expect(panel(page)).toHaveAttribute("data-phase", "ready");
  });

  test("has no axe violations (WCAG 2.2 AA) with an answer on screen", async ({ page }, info) => {
    test.skip(info.project.name.startsWith("webkit"), "axe runs on Chromium and Firefox");
    await page.goto(start(info.project.name, "/grafismo-fonetico/"));
    await openPanel(page);
    await ask(page, "¿Qué incluye el kit?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    const results = await new AxeBuilder({ page })
      .include("#pv-assistant-panel")
      .include('[data-testid="assistant-launcher"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test("reduced motion keeps the panel still", async ({ page }, info) => {
    test.skip(info.project.name !== "chromium-reduced-motion", "reduced-motion project only");
    await page.goto(start(info.project.name, "/"));
    await openPanel(page);
    const motion = await panel(page).evaluate((element) => getComputedStyle(element).animationName);
    expect(motion).toBe("none");
    await ask(page, "¿Para qué edades es?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
  });
});
