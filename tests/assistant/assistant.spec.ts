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
  await page.screenshot({ path: `${SHOTS}/${project}-${name}.png`, animations: "disabled" });
}

// The verification build carries a fake Meta Pixel id (as CI does): Meta hosts are always aborted,
// and every test except the consent one starts with a stored rejection, so no pixel code runs.
test.beforeEach(async ({ context }, info) => {
  await context.route(/^https:\/\/([a-z0-9-]+\.)*facebook\.(com|net)\//, (route) => route.abort());
  if (info.title.includes("consent")) return;
  await context.addInitScript(() => {
    window.localStorage.setItem(
      "pv_consent",
      JSON.stringify({ version: 2, analytics: false, marketing: false, updatedAt: "2026-10-05T00:00:00Z" }),
    );
  });
});

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

  test("launcher is a named star-only control with a supplementary tooltip", async ({ page }, info) => {
    const calls = apiCalls(page);
    await page.goto(start(info.project.name, "/"));
    const control = launcher(page);
    await expect(control).toHaveAccessibleName("Abrir el asistente de Pequeverso");
    await expect(control).toHaveText("");
    await expect(control.locator("img")).toHaveCount(0);
    await expect(control.locator("svg")).toHaveCount(1);
    const bounds = await control.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
    await control.focus();
    await expect(page.getByRole("tooltip")).toHaveText("Abrir el asistente de Pequeverso");
    expect(calls).toHaveLength(0);
    await control.press("Enter");
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toHaveAttribute("data-phase", "ready");
    await shot(page, info.project.name, "star-launcher-open");
  });

  test("answers a question with a streamed, grounded answer", async ({ page }, info) => {
    const calls = apiCalls(page);
    // Exercise a resize notification before the browser delivers the reader's scroll event.
    // Retain the real observer and its callback rather than adding a production test hook.
    await page.addInitScript(() => {
      const NativeObserver = window.ResizeObserver;
      window.ResizeObserver = class extends NativeObserver {
        constructor(callback: ResizeObserverCallback) {
          super(callback);
          const observe = this.observe.bind(this);
          this.observe = (target, options) => {
            if (target.matches("ol[aria-label]") && target.closest("#pv-assistant-panel")) {
              (window as Window & { notifyTranscriptResize?: () => void }).notifyTranscriptResize = () =>
                callback([], this);
            }
            observe(target, options);
          };
        }
      };
    });
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
    const paragraph = answer.locator("p").first();
    const reader = await paragraph.evaluate((element) => {
      let scroller = element.parentElement;
      while (scroller && getComputedStyle(scroller).overflowY !== "auto") scroller = scroller.parentElement;
      if (!scroller) throw new Error("Transcript scroller was not found");
      const before = scroller.scrollTop;
      scroller.scrollTop = 0;
      const after = scroller.scrollTop;
      // The reader has already moved; force resize before the scroll event is delivered.
      if (!(after < before)) throw new Error(`Reader did not move upward: ${before} → ${after}`);
      const notify = (window as Window & { notifyTranscriptResize?: () => void }).notifyTranscriptResize;
      if (!notify) throw new Error("Transcript resize observer was not captured");
      notify();
      return { before, after, afterResize: scroller.scrollTop };
    });
    expect(reader.after).toBeLessThan(reader.before);
    expect(reader.afterResize).toBe(reader.after);
    await expect(paragraph).toBeInViewport();
    const jump = panel(page).getByRole("button", { name: "Ir a la última respuesta" });
    await expect(jump).toBeVisible();
    if (isMobile(info.project.name)) await shot(page, info.project.name, "final-answer-text-visible");
    await jump.click();
    await expect(jump).toBeHidden();
    await expect
      .poll(() =>
        paragraph.evaluate((element) => {
          let scroller = element.parentElement;
          while (scroller && getComputedStyle(scroller).overflowY !== "auto")
            scroller = scroller.parentElement;
          if (!scroller) throw new Error("Transcript scroller was not found");
          return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
        }),
      )
      .toBeLessThanOrEqual(72);
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
    await shot(page, info.project.name, "cancelled");
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

  test("Escape during an IME composition does not minimize", async ({ page }, info) => {
    await page.goto(start(info.project.name, "/"));
    await openPanel(page);
    await composer(page).evaluate((field) => {
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true }));
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "Process", keyCode: 229, bubbles: true }));
    });
    await expect(panel(page)).toBeVisible();
    await composer(page).press("Escape");
    await expect(panel(page)).toBeHidden();
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
    const calls = apiCalls(page);
    await page.goto(start(info.project.name, "/grafismo-fonetico/"));
    await openPanel(page);
    await ask(page, "¿Qué incluye el kit?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    const sent = calls
      .filter((call) => call.url().endsWith("/api/v1/messages"))
      .at(-1)
      ?.postDataJSON();
    expect(sent.context.presentation).toBe("expanded");
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
    const field = composer(page);
    await field.fill("Borrador que debe conservarse al cambiar de tamaño");
    const fieldBox = await field.boundingBox();
    const visual = await page.evaluate(() => ({
      top: visualViewport?.offsetTop ?? 0,
      height: visualViewport?.height ?? innerHeight,
    }));
    expect(fieldBox?.y ?? -1).toBeGreaterThanOrEqual(visual.top);
    expect((fieldBox?.y ?? 0) + (fieldBox?.height ?? 0)).toBeLessThanOrEqual(visual.top + visual.height + 1);
    await expect(field).toHaveValue("Borrador que debe conservarse al cambiar de tamaño");
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

  test("sends only negotiated public context and keeps the first opened path across client navigation", async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== "chromium-desktop",
      "wire context is engine-independent; navigation is covered in every engine",
    );
    const calls = apiCalls(page);
    await page.goto("/soporte/?synthetic=private#fragment");
    await openPanel(page);
    await ask(page, "¿Qué incluye el kit?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    const first = calls
      .filter((call) => call.url().endsWith("/api/v1/messages"))
      .at(-1)
      ?.postDataJSON();
    expect(first.context).toEqual({
      opened_path: "/soporte/",
      current_path: "/soporte/",
      presentation: "compact",
    });
    await panel(page).getByRole("button", { name: "Ampliar panel" }).click();
    await panel(page).getByRole("link", { name: "Ver el material", exact: true }).first().click();
    await expect(page).toHaveURL(/\/grafismo-fonetico\/$/);
    await launcher(page).focus();
    await launcher(page).press("Enter");
    await ask(page, "¿Cómo se utiliza el material?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    const second = calls
      .filter((call) => call.url().endsWith("/api/v1/messages"))
      .at(-1)
      ?.postDataJSON();
    expect(second.context).toEqual({
      opened_path: "/soporte/",
      current_path: "/grafismo-fonetico/",
      presentation: "expanded",
    });
    expect(second.locale).toBe("es");
    expect(calls.filter((call) => call.url().endsWith("/api/v1/session"))).toHaveLength(1);
    await shot(page, info.project.name, "context-preserved-navigation");
  });

  test("assistant language switches without replacing its runtime, history or unsent draft", async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== "chromium-desktop",
      "localization and request hint are engine-independent",
    );
    const calls = apiCalls(page);
    await page.goto("/soporte/");
    await openPanel(page);
    await panel(page).getByRole("combobox", { name: "Idioma del asistente" }).selectOption("en");
    await shot(page, info.project.name, "english-empty");
    await panel(page).getByRole("combobox", { name: "Assistant language" }).selectOption("es");
    let releaseFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    await page.route(`${API}/api/v1/messages`, async (route) => {
      await firstGate;
      await route.continue();
    });
    await ask(page, "¿Qué incluye el kit?");
    await expect(panel(page).getByRole("list").getByText("Pensando…", { exact: true })).toBeVisible();
    await shot(page, info.project.name, "spanish-thinking");
    await panel(page).getByRole("combobox", { name: "Idioma del asistente" }).selectOption("en");
    await expect(panel(page).getByRole("list").getByText("Thinking…", { exact: true })).toBeVisible();
    await expect(panel(page)).toHaveAttribute("data-phase", "submitting");
    await panel(page).getByRole("combobox", { name: "Assistant language" }).selectOption("es");
    releaseFirst();
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    await page.unroute(`${API}/api/v1/messages`);
    await composer(page).fill("Unsent draft stays here");
    await panel(page).getByRole("combobox", { name: "Idioma del asistente" }).selectOption("en");
    const englishField = panel(page).getByRole("textbox", { name: "Write your question" });
    await expect(englishField).toHaveValue("Unsent draft stays here");
    await expect(panel(page)).toHaveAttribute("lang", "en");
    await expect(panel(page).getByText("¿Qué incluye el kit?", { exact: true })).toBeVisible();
    await panel(page).getByRole("button", { name: "Expand panel" }).click();
    await expect(englishField).toHaveValue("Unsent draft stays here");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(englishField).toHaveValue("Unsent draft stays here");
    await page.setViewportSize({ width: 1440, height: 1000 });
    let releaseSecond: () => void = () => {};
    const secondGate = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });
    await page.route(`${API}/api/v1/messages`, async (route) => {
      await secondGate;
      await route.continue();
    });
    await englishField.fill("What is included in the kit?");
    await englishField.press("Enter");
    await expect(panel(page).getByRole("list").getByText("Thinking…", { exact: true })).toBeVisible();
    await shot(page, info.project.name, "english-thinking");
    releaseSecond();
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    await expect(panel(page).locator('[lang="en"]').first()).toBeVisible();
    expect(calls.filter((call) => call.url().endsWith("/api/v1/session"))).toHaveLength(1);
    const sends = calls.filter((call) => call.url().endsWith("/api/v1/messages"));
    expect(sends).toHaveLength(2);
    expect(sends[0]?.postDataJSON().locale).toBe("es");
    expect(sends.at(-1)?.postDataJSON().locale).toBe("en");
    await shot(page, info.project.name, "english-history");
    await panel(page).getByRole("button", { name: "Minimize assistant" }).click();
    await expect(launcher(page)).toHaveAccessibleName("Open the Pequeverso assistant");
    await launcher(page).press("Enter");
    await panel(page).getByRole("combobox", { name: "Assistant language" }).selectOption("es");
    await expect(panel(page)).toHaveAttribute("lang", "es");
    await shot(page, info.project.name, "language-switch-preserved-history");
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

  test("enabled mobile controls reflow at 200 percent and remain reachable in a reduced viewport", async ({
    page,
  }, info) => {
    test.skip(
      info.project.name.includes("mobile") || info.project.name.includes("reduced"),
      "one project per engine covers both explicit phone widths",
    );
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/soporte/");
      await openPanel(page);
      const initialFont = await composer(page).evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
      await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
      await composer(page).fill("Borrador conservado");
      const zoomFont = await composer(page).evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
      expect(zoomFont / initialFont).toBeGreaterThan(1.9);
      const overflow = await panel(page).evaluate((element) =>
        [...element.querySelectorAll("header, form, select, textarea, button, header > div")]
          .filter((node) => node.scrollWidth > node.clientWidth + 1)
          .map((node) => `${node.tagName}.${node.className}`),
      );
      expect(overflow).toEqual([]);
      const transcriptBounds = await panel(page)
        .getByRole("list", { name: "Conversación con el asistente" })
        .locator("..")
        .boundingBox();
      expect(transcriptBounds?.height).toBeGreaterThan(44);
      for (const control of [
        panel(page).getByRole("combobox"),
        panel(page).getByRole("button", { name: "Minimizar asistente" }),
        composer(page),
      ]) {
        await control.focus();
        const bounds = await control.boundingBox();
        expect(bounds).not.toBeNull();
        if (!bounds) throw new Error("Control has no layout box");
        expect(bounds.x).toBeGreaterThanOrEqual(-1);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
        expect(bounds.y).toBeGreaterThanOrEqual(-1);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(845);
      }
      const starter = panel(page)
        .getByRole("region", { name: "Preguntas para empezar" })
        .getByRole("button")
        .last();
      await starter.focus();
      await expect(starter).toBeInViewport();
      const starterBox = await starter.boundingBox();
      expect(starterBox).not.toBeNull();
      if (!starterBox) throw new Error("Starter has no layout box");
      expect(starterBox.x).toBeGreaterThanOrEqual(-1);
      expect(starterBox.x + starterBox.width).toBeLessThanOrEqual(width + 1);
      await shot(page, info.project.name, `enabled-zoom-starters-${width}`);
      await composer(page).focus();
      await shot(page, info.project.name, `enabled-zoom-${width}`);
      await panel(page).getByRole("combobox").selectOption("en");
      const englishField = panel(page).getByRole("textbox", { name: "Write your question" });
      await expect(englishField).toHaveValue("Borrador conservado");
      await englishField.focus();
      const englishOverflow = await panel(page).evaluate((element) =>
        [...element.querySelectorAll("header, form, select, textarea, button, header > div")]
          .filter((node) => node.scrollWidth > node.clientWidth + 1)
          .map((node) => `${node.tagName}.${node.className}`),
      );
      expect(englishOverflow).toEqual([]);
      await shot(page, info.project.name, `enabled-zoom-en-${width}`);
      await panel(page).getByRole("combobox").selectOption("es");
      await page.addStyleTag({ content: "html { font-size: 100% !important; }" });
      await page.setViewportSize({ width, height: 360 });
      await composer(page).focus();
      await expect(composer(page)).toHaveValue("Borrador conservado");
      await expect
        .poll(async () =>
          composer(page).evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            const viewport = window.visualViewport;
            return (
              !!viewport &&
              bounds.bottom <= viewport.offsetTop + viewport.height + 1 &&
              bounds.top >= viewport.offsetTop - 1
            );
          }),
        )
        .toBe(true);
      const clipped = await panel(page).evaluate((element) => element.scrollWidth > element.clientWidth + 1);
      expect(clipped).toBe(false);
      await shot(page, info.project.name, `reduced-viewport-${width}`);
    }
  });

  test("long unbroken text and 200 % text size do not overflow", async ({ page }, info) => {
    await page.goto(start(info.project.name, "/"));
    await openPanel(page);
    // Scale after opening so the test can inspect the assistant controls and transcript directly.
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await ask(page, `¿Sirve este enlace https://pequeverso.com/${"muy-largo-".repeat(30)} para comprar?`);
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("Viewport was not set");
    for (const width of isMobile(info.project.name) ? [320, 390] : [viewport.width]) {
      await page.setViewportSize({ width, height: viewport.height });
      await expect
        .poll(() => panel(page).evaluate((element) => element.clientWidth))
        .toBeLessThanOrEqual(width);
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
      const answerText = panel(page)
        .getByRole("listitem")
        .filter({ has: page.getByRole("heading", { name: "Asistente" }) })
        .last()
        .locator("p")
        .first();
      await answerText.evaluate((paragraph) => {
        let scroller = paragraph.parentElement;
        while (scroller && getComputedStyle(scroller).overflowY !== "auto") scroller = scroller.parentElement;
        if (!scroller) throw new Error("Transcript scroller was not found");
        scroller.scrollTop += paragraph.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      });
      await expect(answerText).toBeInViewport();
      const jump = panel(page).getByRole("button", { name: "Ir a la última respuesta" });
      await expect(jump).toBeVisible();
      const reading = await answerText.evaluate((paragraph) => {
        let scroller = paragraph.parentElement;
        while (scroller && getComputedStyle(scroller).overflowY !== "auto") scroller = scroller.parentElement;
        if (!scroller) throw new Error("Transcript scroller was not found");
        const jump = document.querySelector<HTMLButtonElement>(
          'button[aria-label="Ir a la última respuesta"]',
        );
        if (!jump) throw new Error("Jump control was not found");
        const area = scroller.getBoundingClientRect();
        const text = paragraph.getBoundingClientRect();
        const control = jump.getBoundingClientRect();
        const line = Number.parseFloat(getComputedStyle(paragraph).lineHeight);
        const y = Math.max(area.top, text.top) + line / 2;
        const hit = document.elementFromPoint(text.left + 2, y);
        return {
          targetWidth: control.width,
          targetHeight: control.height,
          inside: control.top >= area.top && control.bottom <= area.bottom,
          separate: text.right <= control.left,
          visibleLine: Math.min(text.bottom, area.bottom) - Math.max(text.top, area.top) >= line,
          readable: hit === paragraph || (hit !== null && paragraph.contains(hit)),
        };
      });
      expect(reading).toEqual({
        targetWidth: 44,
        targetHeight: 44,
        inside: true,
        separate: true,
        visibleLine: true,
        readable: true,
      });
      await shot(page, info.project.name, `zoom-long-text-${width}`);
    }
  });

  test("an unreachable API leaves the store working and recovers on request", async ({ page }, info) => {
    await page.route(`${API}/**`, (route) => route.abort());
    await page.goto(start(info.project.name, "/grafismo-fonetico/"));
    await launcher(page).click();
    await expect(panel(page).getByText("No pudimos conectar con el asistente.")).toBeVisible();
    await shot(page, info.project.name, "connection-error");
    await panel(page).getByRole("button", { name: "Minimizar asistente" }).click();
    // The store keeps working: its own navigation (and, on the landing, the checkout link) is intact.
    await expect(page.locator("main a[href]").first()).toBeAttached();
    if (!info.project.name.startsWith("webkit"))
      await expect(page.locator('a[href^="https://pay.hotmart.com/"]').first()).toBeAttached();
    await page.unroute(`${API}/**`);
    await launcher(page).click();
    await panel(page).getByRole("button", { name: "Reintentar conexión" }).click();
    await expect(panel(page)).toHaveAttribute("data-phase", "ready");
    await shot(page, info.project.name, "connection-recovered");
  });

  test("an open panel is never covered by the consent banner, which stays usable", async ({ page }, info) => {
    await page.goto(start(info.project.name, "/"));
    const banner = page.getByTestId("consent-banner");
    await expect(banner).toBeVisible();
    // On phones the banner may cover the launcher until the visitor decides; keyboard still reaches it.
    await launcher(page).focus();
    await page.keyboard.press("Enter");
    await expect(panel(page)).toHaveAttribute("data-phase", /ready|completed/);
    const box = await composer(page).boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const top = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x ?? 0, y ?? 0)?.closest("#pv-assistant-panel") !== null,
        [box.x + box.width / 2, box.y + box.height / 2],
      );
      expect(top, "the composer is the topmost element at its centre").toBe(true);
    }
    await ask(page, "¿Para qué edades es?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    await panel(page).getByRole("button", { name: "Minimizar asistente" }).click();
    await expect(banner).toBeVisible();
    expect(await banner.evaluate((node) => node.closest("[inert]") === null)).toBe(true);
    await banner.getByRole("button", { name: "Rechazar" }).click();
    await expect(banner).toHaveCount(0);
  });

  test("has no axe violations (WCAG 2.2 AA) with an answer on screen", async ({ page }, info) => {
    test.skip(info.project.name.startsWith("webkit"), "axe runs on Chromium and Firefox");
    await page.goto(start(info.project.name, "/grafismo-fonetico/"));
    await openPanel(page);
    await ask(page, "¿Qué incluye el kit?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    // A second answer repeats the product card: ids must stay unique (axe duplicate-id rules).
    await ask(page, "¿Cuánto cuesta el kit?");
    await expect(panel(page)).toHaveAttribute("data-phase", "completed");
    expect(await panel(page).getByRole("article").count()).toBeGreaterThan(1);
    const ids = await page
      .locator("#pv-assistant-panel [id]")
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
    const results = await new AxeBuilder({ page })
      .include("#pv-assistant-panel")
      .include('[data-testid="assistant-launcher"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map(
        (v) =>
          `${v.id}: ${v.nodes.map((n) => `${n.target.join(" ")} ${n.failureSummary ?? ""}`.slice(0, 300)).join(" | ")}`,
      ),
    ).toEqual([]);
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
