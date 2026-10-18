import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Resize text (WCAG 1.4.4) and reflow (1.4.10): with text at 200 % no route scrolls sideways at
 * 320 or 390 CSS px, and no text is pushed off-screen where an `overflow: clip` band would hide it.
 *
 * Text-only zoom is simulated by doubling the root font size (`html { font-size: 200% }`). That is
 * what the browser's font-size setting does to this rem-based stylesheet: every rem (type, spacing,
 * radii, container-query thresholds) doubles while px values and the viewport stay put. Media
 * queries keep their 100 % thresholds, which at these widths only matters for `max-width` queries.
 * `content-visibility` is forced visible so deferred bands are laid out and measured too.
 * Sweeps its own widths, so it runs in the 390 project only.
 */
test.beforeEach(() => {
  test.skip(!test.info().project.name.endsWith("-390"), "sweeps its own widths; runs in the 390 project");
});

const widths = [320, 390] as const;
const routes = [
  "/",
  "/grafismo-fonetico/",
  "/imprime-y-juega/",
  "/imprime-y-juega/?downsell=1",
  "/grafismo-fonetico/gracias/",
  "/soporte/",
  "/privacidad/",
  "/cookies/",
  "/compras-y-reembolsos/",
  "/terminos/",
  "/aviso-legal/",
  "/arrepentimiento/",
  "/esta-no-existe/",
];
const TEXT_ZOOM_CSS = "html { font-size: 200% !important; } * { content-visibility: visible !important; }";

/**
 * Page overflow, the outermost boxes that reach past the viewport edges (fixed layers included),
 * and visible text that runs off-screen. Scroll containers (tables), inactive carousel slides and
 * the decorative marquee are horizontal by design and skipped.
 */
async function reflowFaults(page: Page) {
  return page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    const width = root.clientWidth;
    const describe = (el: Element, left: number, right: number) => {
      const slot = el.getAttribute("data-slot");
      const classes = String(el.getAttribute("class") ?? "").slice(0, 60);
      const text = (el.textContent ?? "").trim().slice(0, 30);
      return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${slot ? `[${slot}]` : ""} .${classes} "${text}" (${Math.round(left)}→${Math.round(right)})`;
    };
    const outside = (el: Element) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.right > width + 0.5 || rect.left < -0.5);
    };
    const scrolls = (el: Element) => {
      for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
        if (["auto", "scroll"].includes(getComputedStyle(node).overflowX)) return true;
        if (node.matches("[aria-roledescription='diapositiva']:not([data-active]), .pv-marquee-track"))
          return true;
      }
      return false;
    };
    /** Clipped by an ancestor that itself fits (a carousel viewport, a rounded media frame). */
    const contained = (el: Element) => {
      for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
        if (getComputedStyle(node).overflowX !== "visible" && !outside(node)) return true;
      }
      return false;
    };
    const boxes = [...document.querySelectorAll("body *")]
      .filter((el) => outside(el) && !contained(el) && !scrolls(el))
      .filter((el) => !(el.parentElement && el.parentElement !== document.body && outside(el.parentElement)))
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return `box ${describe(el, rect.left, rect.right)}`;
      });
    const text: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement;
      if (!el || !node.textContent?.trim()) continue;
      if (el.closest("[aria-hidden='true'], .sr-only, [inert], script, style, noscript, template")) continue;
      if (!el.checkVisibility() || scrolls(el)) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const line = [...range.getClientRects()].find(
        (rect) => rect.width >= 1 && (rect.right > width + 1 || rect.left < -1),
      );
      if (line) text.push(`text ${describe(el, line.left, line.right)}`);
    }
    return { scrollWidth: root.scrollWidth, clientWidth: width, faults: [...boxes, ...text].slice(0, 15) };
  });
}

for (const route of routes) {
  test(`200 % text reflows without horizontal scroll or clipped text: ${route}`, async ({ page }) => {
    test.setTimeout(60_000);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route, { waitUntil: "load" });
      await page.addStyleTag({ content: TEXT_ZOOM_CSS });
      await page.locator("details").evaluateAll((details) => {
        for (const detail of details) (detail as HTMLDetailsElement).open = true;
      });
      await page.evaluate(() => document.fonts.ready);
      if (route === "/") {
        // Exercise the actual floating choices: hidden/inert text alone cannot establish that
        // long labels remain readable or that enlarged controls leave room for the page.
        await page.locator("#preguntas h2").scrollIntoViewIfNeeded();
        const bar = page.getByTestId("hub-sticky");
        await expect(bar).toHaveAttribute("data-mode", "doors");
        await expect(bar).toHaveCSS("visibility", "visible");
        const bounds = await bar.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds?.height).toBeLessThan(844 / 3);
        for (const link of await bar.getByRole("link").all()) {
          expect(await link.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        }
      }
      const result = await reflowFaults(page);
      expect
        .soft({ width: result.scrollWidth, faults: result.faults }, `${route} @${width} with 200 % text`)
        .toEqual({ width: result.clientWidth, faults: [] });
    }
  });
}

// Each viewport starts in its own visitor context: resizing and navigating a second time
// should not consume the first viewport's assertion budget or carry a pending consent dialog.
for (const width of widths) {
  test(`enlarged text keeps the active floating offer readable and compact at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/grafismo-fonetico/", { waitUntil: "load" });
    const consent = page.getByTestId("consent-banner");
    if (process.env.E2E_EXPECT_CONSENT) {
      await consent.getByRole("button", { name: "Rechazar", exact: true }).click();
    }
    await expect(consent).toHaveCount(0);
    await page.addStyleTag({ content: TEXT_ZOOM_CSS });
    await page.evaluate(() => document.fonts.ready);
    await page.locator("#metodo-title").evaluate((element) => {
      element.scrollIntoView({ block: "start", behavior: "instant" });
    });
    const sticky = page.getByTestId("sticky-cta");
    await expect(sticky).toHaveAttribute("data-visible", "");
    const bounds = await sticky.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds?.height).toBeLessThan(844 / 3);
    const result = await reflowFaults(page);
    expect({ width: result.scrollWidth, faults: result.faults }).toEqual({
      width: result.clientWidth,
      faults: [],
    });
    const action = sticky.getByRole("link");
    await expect(action).toBeVisible();
    // Require the whole action, plus an unobstructed center. A one-pixel rounding
    // allowance matches the text-edge probe above; a partial intersection is insufficient.
    await expect
      .poll(() =>
        action.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return {
            inViewport:
              rect.width > 0 &&
              rect.height > 0 &&
              rect.left >= -1 &&
              rect.top >= -1 &&
              rect.right <= innerWidth + 1 &&
              rect.bottom <= innerHeight + 1,
            centerReachable: element.contains(hit),
          };
        }),
      )
      .toEqual({ inViewport: true, centerReachable: true });
  });
}
