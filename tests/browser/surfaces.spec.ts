import { expect, test } from "./fixtures";

for (const route of ["/", "/grafismo-fonetico/", "/imprime-y-juega/", "/privacidad/"]) {
  test(`painted surfaces avoid repeated backdrop compositing: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator(".glass, .glass-dark").first()).toBeVisible();
    const filters = await page.evaluate(() => {
      const found: string[] = [];
      for (const element of document.querySelectorAll("*")) {
        for (const pseudo of [null, "::before", "::after"]) {
          const style = getComputedStyle(element, pseudo);
          for (const property of ["backdrop-filter", "-webkit-backdrop-filter"]) {
            const filter = style.getPropertyValue(property);
            if (filter && filter !== "none") {
              found.push(`${element.tagName.toLowerCase()}${pseudo ?? ""}: ${property}: ${filter}`);
            }
          }
        }
      }
      return found;
    });
    expect(filters, `${route}: surfaces must remain responsive without backdrop layers`).toEqual([]);
  });
}
