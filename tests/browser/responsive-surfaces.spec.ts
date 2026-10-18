import { collectLayoutFaults } from "../helpers/responsive-layout.ts";
import { expect, test } from "./fixtures";

const image = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e4f7f5"/><path d="M0 0L400 300M400 0L0 300" stroke="#003068" stroke-width="8"/></svg>',
)}`;

for (const boxSizing of ["content-box", "border-box"] as const) {
  test(`image aspect uses the ${boxSizing} content box through visual transforms`, async ({ page }) => {
    // Both variants have a 200×150 CSS content box; the second also has real padding/borders.
    const box =
      boxSizing === "border-box"
        ? "box-sizing:border-box;width:268px;height:178px;padding:10px 30px;border:4px solid #003068"
        : "box-sizing:content-box;width:200px;height:150px";
    await page.setContent(`
      <main>
        <figure id="stage" style="margin:32px 8px;width:268px;perspective:1200px;transform:rotate(1deg) scale(.97)">
          <div id="projected" style="transform:rotateY(-28deg)">
            <img id="subject" src="${image}" width="400" height="300"
              style="display:block;object-fit:fill;${box}">
          </div>
        </figure>
      </main>
    `);
    const subject = page.locator("#subject");
    await subject.evaluate(async (element: HTMLImageElement) => element.decode());
    expect(
      await subject.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight]),
    ).toEqual([400, 300]);
    const parentBefore = await page.locator("#projected").getAttribute("style");

    // A rotation, uniform scale and perspective project the AABB, but do not stretch the image.
    expect(await page.evaluate(collectLayoutFaults)).toEqual([]);

    // Stretch only the CSS content height by 3%, in place under the exact same transformed parent.
    await subject.evaluate((element, sizing) => {
      element.style.height = sizing === "border-box" ? "182.5px" : "154.5px";
    }, boxSizing);
    const faults = await page.evaluate(collectLayoutFaults);
    expect(faults).toHaveLength(1);
    expect(faults[0]).toContain("is stretched");
    expect(await subject.evaluate((element) => element.parentElement?.id)).toBe("projected");
    expect(await page.locator("#projected").getAttribute("style")).toBe(parentBefore);
  });
}
