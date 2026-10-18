import { createServer } from "node:http";
import { expect, test } from "./fixtures";

/**
 * The home as the hub of two products (docs/specs/home-hub.md): both doors in the first viewport,
 * stable anchors for bios, the header «Productos» menu (native popover) and the contextual sticky
 * bar with the affiliate disclosure.
 */

test("both doors are inside the first viewport, the same size, and select each product destination directly", async ({
  page,
}) => {
  await page.goto("/");
  const doors = page.locator("a[data-door]");
  await expect(doors).toHaveCount(2);
  await expect(doors.nth(0)).toHaveAttribute("href", "/grafismo-fonetico/");
  await expect(doors.nth(1)).toHaveAttribute("href", "/alimentacion-bebe/?src=sitio-home");
  const viewport = page.viewportSize();
  const boxes = await Promise.all([doors.nth(0).boundingBox(), doors.nth(1).boundingBox()]);
  for (const box of boxes) {
    expect(box).not.toBeNull();
    // Visible without scrolling (at least the top half of each door).
    expect((box?.y ?? 0) + (box?.height ?? 0) / 2).toBeLessThanOrEqual(viewport?.height ?? 0);
  }
  // Same layout size (offset sizes ignore the entrance transform that may still be running).
  const sizes = await doors.evaluateAll((els) =>
    els.map((el) => [(el as HTMLElement).offsetWidth, (el as HTMLElement).offsetHeight]),
  );
  expect(sizes[0]).toEqual(sizes[1]);
  // A visitor can identify the actual product and its origin before following either door,
  // including on phones where the old chooser hid both product names.
  await expect(doors.nth(0).getByText("Grafismo Fonético", { exact: true })).toBeVisible();
  await expect(doors.nth(1).getByText("Guía de Alimentación para Bebés", { exact: true })).toBeVisible();
  await expect(doors.nth(0).getByText("Kit de Pequeverso", { exact: true })).toBeVisible();
  await expect(doors.nth(1).getByText("Curso afiliado", { exact: true })).toBeVisible();
  const actions = await doors
    .locator("[data-door-action]")
    .evaluateAll((els) =>
      els.map((el) => [(el as HTMLElement).offsetWidth, (el as HTMLElement).offsetHeight]),
    );
  expect(actions[0]).toEqual(actions[1]);
  // The course door is described by the affiliate disclosure, printed right under the doors.
  const describedBy = await doors.nth(1).getAttribute("aria-describedby");
  await expect(page.locator(`#${describedBy}`)).toContainText("Enlace de afiliado");
  await expect(page.locator(`#${describedBy}`)).toBeVisible();
  // Neither door uses the coral purchase style.
  for (const door of await doors.all()) await expect(door.locator(".bg-primary")).toHaveCount(0);
});

test("anchors for bios work on direct entry, below the header", async ({ page }) => {
  for (const anchor of ["leer", "bebe", "grafismo-fonetico", "alimentacion-bebe", "preguntas"]) {
    await page.goto(`/#${anchor}`);
    const target = page.locator(`[id="${anchor}"]`);
    await expect(target).toHaveCount(1);
    await expect
      .poll(() => target.evaluate((el) => Math.round(el.getBoundingClientRect().top)), { timeout: 5_000 })
      .toBeLessThan(400);
  }
});

test("header «Productos» opens a menu with both needs and closes on Escape", async ({ page }) => {
  await page.goto("/");
  const trigger = page.locator("header [data-products-trigger]");
  await expect(trigger).toBeVisible();
  const box = await trigger.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  await trigger.click();
  const panel = page.getByRole("navigation", { name: "Menú de productos" });
  await expect(panel).toBeVisible();
  const cards = panel.getByRole("link");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toHaveAttribute("href", "/grafismo-fonetico/");
  await expect(cards.nth(1)).toHaveAttribute("href", "/alimentacion-bebe/?src=sitio-home");
  await expect(cards.nth(1)).toContainText("Recomendado");
  await expect(cards.nth(1)).toContainText("Enlace de afiliado");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  // Prevent real affiliate navigation while exercising its click and panel dismissal.
  await trigger.click();
  await cards.nth(1).evaluate((link) => link.addEventListener("click", (event) => event.preventDefault()));
  await cards.nth(1).click();
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test("the header menu is on the hub pages but never on the purchase or post-purchase pages", async ({
  page,
}) => {
  for (const route of ["/"]) {
    await page.goto(route);
    await expect(page.locator("header [data-products-trigger]"), route).toHaveCount(1);
  }
  for (const route of ["/grafismo-fonetico/", "/imprime-y-juega/", "/grafismo-fonetico/gracias/"]) {
    await page.goto(route);
    await expect(page.locator("header [data-products-trigger]"), route).toHaveCount(0);
  }
});

test("phone sticky bar follows the chapter in view and keeps the disclosure next to the course", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  const bar = page.getByTestId("hub-sticky");
  await expect(bar).toHaveCSS("visibility", "hidden");
  await page.locator("#leer h2").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect(bar).toHaveAttribute("data-mode", "reading");
  await expect(bar.locator('a[data-position="sticky"]')).toHaveAttribute("href", /\/grafismo-fonetico\//);
  await page.locator("#bebe h2").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect(bar).toHaveAttribute("data-mode", "feeding");
  await expect(bar.locator("a[data-affiliate]")).toHaveAttribute("rel", /sponsored/);
  await expect(bar).toContainText("Enlace de afiliado: si compras, Pequeverso recibe una comisión");
  await page.locator("#cierre").scrollIntoViewIfNeeded();
  await expect(bar).toHaveAttribute("data-mode", "hidden");
});

test("an anchor jump keeps the header visible and lands the chapter right under it", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // Existing informational navigation still jumps with the header visible. Product selection does not scroll.
  const trigger = page.locator('[data-slot="mobile-nav-trigger"]');
  if (await trigger.isVisible()) {
    await trigger.click();
    await page.getByRole("dialog").getByRole("link", { name: "Preguntas", exact: true }).click();
  } else {
    await page.locator('header a[href="#preguntas"]').click();
  }
  await expect(page).toHaveURL(/#preguntas$/);
  const header = page.locator('[data-slot="header"]');
  await expect(header).not.toHaveAttribute("data-hidden", "");
  await expect
    .poll(() =>
      page.evaluate(() => {
        // Gap between the visible header and the chapter's first visible content.
        const pill = document.querySelector('[data-slot="header-pill"]')?.getBoundingClientRect();
        const tops = [...document.querySelectorAll<HTMLElement>("#preguntas [data-reveal], #preguntas h2")]
          .map((el) => el.getBoundingClientRect())
          .filter((rect) => rect.height > 0)
          .map((rect) => rect.top);
        return Math.min(...tops) - (pill?.bottom ?? 0);
      }),
    )
    .toBeLessThan(64);
});

// Drive the real mounted controller through a long anchor scroll with a controlled clock.
// Suppressing only native scrollend lets the fixture decide when this continuous scroll ends;
// it does not stub the component, its scroll listener, or its data-hidden mutation.
for (const nativeScrollEnd of [true, false]) {
  test(`anchor header follows scroll completion (${nativeScrollEnd ? "native" : "fallback"})`, async ({
    page,
  }) => {
    if (!nativeScrollEnd) {
      await page.addInitScript(() => {
        let prototype: object | null = document;
        while (prototype) {
          if (Object.hasOwn(prototype, "onscrollend")) Reflect.deleteProperty(prototype, "onscrollend");
          prototype = Object.getPrototypeOf(prototype);
        }
      });
    }
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.clock.install();
    await page.evaluate((native) => {
      if ("onscrollend" in document !== native) throw new Error("Unexpected scrollend fixture support");
      document.addEventListener(
        "scrollend",
        (event) => {
          if (event.isTrusted) event.stopImmediatePropagation();
        },
        true,
      );
      const anchor = document.querySelector<HTMLAnchorElement>('header a[href="#preguntas"]');
      if (!anchor) throw new Error("Missing informational anchor");
      anchor.addEventListener("click", (event) => event.preventDefault(), { once: true });
      anchor.click();
      // A nested scrolling surface finishing must not end the document's anchor scroll.
      document.body.dispatchEvent(new Event("scrollend", { bubbles: true }));
    }, nativeScrollEnd);
    const header = page.locator('[data-slot="header"]');
    for (const top of [400, 600, 800, 1000]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
      await page.clock.runFor(700);
      await expect(header).not.toHaveAttribute("data-hidden", "");
    }
    // A real completed scroll releases the native lifecycle. The fallback waits for quiet.
    if (nativeScrollEnd) await page.evaluate(() => document.dispatchEvent(new Event("scrollend")));
    else await page.clock.runFor(1300);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await page.clock.runFor(100);
    await expect(header).toHaveAttribute("data-hidden", "");
    // User intent cancels a new hold immediately, including a zero-distance anchor click.
    await page.evaluate(() => {
      const anchor = document.querySelector<HTMLAnchorElement>('header a[href="#preguntas"]');
      anchor?.addEventListener("click", (event) => event.preventDefault(), { once: true });
      anchor?.click();
      window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }));
      window.scrollTo({ top: 1400, behavior: "instant" });
    });
    await page.clock.runFor(100);
    await expect(header).toHaveAttribute("data-hidden", "");
  });
}

test("purchase and post-purchase footers keep the single-product column", async ({ page }) => {
  for (const route of ["/grafismo-fonetico/", "/imprime-y-juega/", "/grafismo-fonetico/gracias/"]) {
    await page.goto(route);
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("navigation", { name: "Producto", exact: true }), route).toHaveCount(1);
    await expect(footer.locator('a[href="/#bebe"]'), route).toHaveCount(0);
    await expect(footer.locator('a[href="/grafismo-fonetico/#preguntas"]'), route).toHaveCount(1);
  }
  await page.goto("/");
  const course = page.getByRole("contentinfo").locator("a[data-affiliate]");
  await expect(course).toHaveAttribute("href", "/alimentacion-bebe/?src=sitio-home");
  await expect(course).toHaveAttribute("target", "_blank");
  await expect(course).toHaveAttribute("rel", "sponsored noopener");
  await expect(page.getByRole("contentinfo")).toContainText("Enlace de afiliado");
});

test("Tab past the last menu card closes the products panel", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const trigger = page.locator("header [data-products-trigger]");
  await trigger.click();
  const panel = page.getByRole("navigation", { name: "Menú de productos" });
  await expect(panel).toBeVisible();
  await panel.getByRole("link").last().focus();
  await page.keyboard.press("Tab");
  await expect(panel).toBeHidden();
});

test("direct selection preserves acquisition, announces the affiliate and emits one existing event", async ({
  page,
}) => {
  await page.goto("/?utm_source=home-regression&off=EVIL&ref=EVIL");
  const kit = page.locator('a[data-door="reading"]');
  const course = page.locator('a[data-door="feeding"]');
  await expect(kit).toHaveAttribute("href", "/grafismo-fonetico/?utm_source=home-regression");
  await expect(course).toHaveAttribute("href", "/alimentacion-bebe/?src=sitio-home");
  await expect(course).toHaveAttribute("target", "_blank");
  await expect(course).toHaveAttribute("rel", "sponsored noopener");
  await expect(course).toContainText("se abre en una pestaña nueva");
  await expect(course.locator("svg.lucide-external-link:visible")).toHaveCount(1);
  await expect(page.locator("a a, a button")).toHaveCount(0);
  await kit.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault()));
  await course.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault()));
  await kit.click();
  await course.click();
  const events = await page.evaluate(
    () => (window as unknown as { dataLayer?: { event: string }[] }).dataLayer ?? [],
  );
  expect(events.filter(({ event }) => event === "PequeversoProductInterest")).toHaveLength(1);
  expect(events.filter(({ event }) => event === "PequeversoAffiliateClick")).toHaveLength(1);
  expect(
    events.filter(({ event }) => ["CheckoutIntent", "InitiateCheckout", "Purchase"].includes(event)),
  ).toHaveLength(0);
});

test("mobile product selections go directly to the destinations and close the sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('[data-slot="mobile-nav-trigger"]').click();
  const sheet = page.getByRole("dialog", { name: "¿Qué necesitas hoy?", exact: true });
  const menu = sheet.getByRole("navigation", { name: "Productos", exact: true });
  const links = menu.getByRole("link");
  await expect(links.nth(0)).toHaveAttribute("href", "/grafismo-fonetico/");
  await expect(links.nth(1)).toHaveAttribute("href", "/alimentacion-bebe/?src=sitio-home");
  await expect(links.nth(1)).toHaveAttribute("rel", "sponsored noopener");
  await expect(links.nth(1)).toContainText("Enlace de afiliado");
  await links.nth(1).evaluate((link) => link.addEventListener("click", (event) => event.preventDefault()));
  await links.nth(1).click();
  await expect(sheet).toBeHidden();
});

test("the kit door opens our landing, keeping acquisition and excluding offer overrides", async ({
  page,
}) => {
  await page.goto("/?utm_source=home-route&off=EVIL&ref=EVIL");
  const kit = page.locator('a[data-door="reading"]');
  await expect(kit).toHaveAttribute("href", "/grafismo-fonetico/?utm_source=home-route");
  await kit.click();
  await expect(page).toHaveURL(/\/grafismo-fonetico\/\?utm_source=home-route$/);
  await expect(page.locator("main a[data-checkout]").first()).toBeVisible();
});

test("404 offers the existing affiliate redirect with a disclosure instead of a chapter detour", async ({
  page,
}) => {
  await page.goto("/pagina-inexistente-para-prueba/");
  const course = page.locator("main a[data-affiliate]");
  await expect(course).toHaveAttribute("href", "/alimentacion-bebe/?src=sitio-home");
  await expect(course).toHaveAttribute("target", "_blank");
  await expect(course).toHaveAttribute("rel", "sponsored noopener");
  await expect(page.locator("#not-found-affiliate")).toBeVisible();
  await expect(page.locator("main a[href='/#bebe']")).toHaveCount(0);
});

test("the course selection opens the redirect path in a separate tab without contacting a merchant", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const destination = new URL("/__merchant-fixture/", page.url());
  const received: string[] = [];
  // WebKit cannot route.fulfill a 302. Send a real HTTP redirect from a private loopback
  // server instead; no configured merchant URL or checkout is ever requested.
  const redirect = createServer((request, response) => {
    received.push(request.url ?? "");
    response.writeHead(302, { Location: destination.href });
    response.end();
  });
  await new Promise<void>((resolve) => redirect.listen(0, "127.0.0.1", resolve));
  try {
    const address = redirect.address();
    if (!address || typeof address === "string") throw new Error("Missing isolated redirect port");
    await context.route("**/alimentacion-bebe/?src=sitio-home", (route) =>
      route.continue({ url: `http://127.0.0.1:${address.port}/alimentacion-bebe/?src=sitio-home` }),
    );
    await context.route("**/__merchant-fixture/", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<title>Destino aislado</title><p>Redirección simulada</p>",
      }),
    );
    const popupPromise = page.waitForEvent("popup");
    await page.locator('a[data-door="feeding"]').click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(destination.href);
    expect(received).toEqual(["/alimentacion-bebe/?src=sitio-home"]);
    await expect(page).toHaveURL(/\/$/);
    await popup.close();
  } finally {
    await new Promise<void>((resolve, reject) =>
      redirect.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("enlarged text keeps both product menus free of clipped selections", async ({ page }) => {
  test.setTimeout(60_000);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const mode of ["popover", "sheet"]) {
      await page
        .locator(mode === "popover" ? "header [data-products-trigger]" : '[data-slot="mobile-nav-trigger"]')
        .click();
      const menu =
        mode === "popover"
          ? page.locator("#pv-productos")
          : page.getByRole("dialog").getByRole("navigation", { name: "Productos", exact: true });
      await expect(menu).toBeVisible();
      const links = menu.getByRole("link");
      await expect(links).toHaveCount(2);
      for (const link of await links.all()) {
        await link.focus();
        expect(
          await link.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
          `${mode} @${width}: selection text must fit`,
        ).toBe(true);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth === document.documentElement.clientWidth,
        ),
      ).toBe(true);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
    }
  }
});
