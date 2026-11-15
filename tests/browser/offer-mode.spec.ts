import { expect, test } from "./fixtures";

test("upsell mode by default: upsell view visible, downsell hidden, one widget container", {
  tag: "@journey",
}, async ({ page }) => {
  await page.goto("/imprime-y-juega/");
  await expect(page.locator("[data-offer-root]")).toHaveAttribute("data-offer", "upsell");
  await expect(page.locator("#hero-title-upsell")).toBeVisible();
  await expect(page.locator("#hero-title-downsell")).toBeHidden();
  await expect(page.locator("#gfp-decision-title")).toBeVisible();
  await expect(page.locator("#gfp-decision-title-downsell")).toBeHidden();
  await expect(page.locator("#hotmart-sales-funnel")).toHaveCount(1);
  await expect(page.locator('script[src*="hotmart-checkout-elements.js"]')).toHaveCount(1);
  await expect(page.locator("a[href*='pay.hotmart.com']")).toHaveCount(0);
});

for (const query of ["?downsell=1", "?offer=downsell", "?downsell=1&utm_source=x"]) {
  test(`downsell mode via ${query} is applied before paint (no flash)`, async ({ page }) => {
    // Record the attribute at DOMContentLoaded: the inline script must already have run,
    // long before React hydrates.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { __offerAtDcl?: string | null }).__offerAtDcl =
          document.querySelector("[data-offer-root]")?.getAttribute("data-offer") ?? null;
      });
    });
    await page.goto(`/imprime-y-juega/${query}`);
    const atDcl = await page.evaluate(
      () => (window as unknown as { __offerAtDcl?: string | null }).__offerAtDcl,
    );
    expect(atDcl).toBe("downsell");
    await expect(page.locator("[data-offer-root]")).toHaveAttribute("data-offer", "downsell");
    await expect(page.locator("#hero-title-downsell")).toBeVisible();
    await expect(page.locator("#hero-title-upsell")).toBeHidden();
    await expect(page.locator("#gfp-decision-title-downsell")).toBeVisible();
    await expect(page.locator("#gfp-decision-title")).toBeHidden();
    await expect(page.locator("#hero")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("#hotmart-sales-funnel")).toHaveCount(1);
    await expect(page.getByText("US$7,49").first()).toBeVisible();
  });
}

test("canonical and robots for the downsell variant point to the base page and noindex", async ({
  page,
}) => {
  await page.goto("/imprime-y-juega/?downsell=1");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/imprime-y-juega\/$/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("editorial CTAs move focus to the widget slot and no direct checkout link exists", async ({
  page,
}) => {
  await page.goto("/imprime-y-juega/");
  await page.locator("header a[data-decision-link]").click();
  await expect(page.locator("#gfp-decision")).toBeFocused();
  await expect(page.locator("a[href*='checkout'], a[href*='pay.hotmart']")).toHaveCount(0);
});

test("the composition counters ship their final numbers in the server HTML", async ({
  request,
}) => {
  const html = await (await request.get("/imprime-y-juega/")).text();
  expect(html).toMatch(/<span[^>]*>384<\/span>/);
  expect(html).toMatch(/<span[^>]*>6<\/span>/);
  expect(html).toMatch(/<span[^>]*>9<\/span>/);
});

for (const [query, visible, hidden, price] of [
  ["", ".only-upsell", ".only-downsell", "US$14,99"],
  ["?downsell=1", ".only-downsell", ".only-upsell", "US$7,49"],
] as const) {
  test(`sticky decision link shows the ${visible} label for /imprime-y-juega/${query}`, async ({
    page,
  }) => {
    await page.goto(`/imprime-y-juega/${query}`);
    const link = page.locator("[data-testid='sticky-cta'] a[data-decision-link]");
    await expect(link).toHaveAttribute("href", "#gfp-decision");
    await expect(link.locator(visible)).toContainText(price);
    const displays = await link.evaluate(
      (el, selectors) =>
        selectors.map(
          (selector) => getComputedStyle(el.querySelector(selector) as Element).display,
        ),
      [visible, hidden] as [string, string],
    );
    expect(displays[0]).not.toBe("none");
    expect(displays[1]).toBe("none");
  });
}

test("sticky decision bar stays hidden over the offer hero and appears after it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/imprime-y-juega/");
  const bar = page.getByTestId("sticky-cta");
  await expect(bar).not.toHaveAttribute("data-visible", "");
  // Scroll to a heading that sits past every element hiding the bar (hero, #gfp-decision, final
  // offer, footer). The old target, #complemento-title, directly follows the tall #gfp-decision
  // band, which could still intersect the viewport (threshold 5%) while the wheel step or the
  // section heights settled, so the bar legitimately stayed hidden.
  // Scroll through the DOM (Playwright's scrollIntoViewIfNeeded is a no-op in WebKit here: scrollY stays
  // 0 with the heading ~3,500 px down) and repeat it while polling: WebKit keeps growing the page
  // (~8,200 -> ~10,700 px) as images and sections settle, so a single scroll can land over the
  // decision band once the layout shifts, and the bar then legitimately stays hidden.
  const heading = page.locator("#incluye-title");
  await expect
    .poll(
      async () => {
        await heading.evaluate((element) => element.scrollIntoView());
        return [await bar.getAttribute("data-visible"), await bar.isVisible()];
      },
      { timeout: 20_000 },
    )
    .toEqual(["", true]);
});
