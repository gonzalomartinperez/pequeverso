import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { expect, test } from "@playwright/test";

const source = ["domain/profile.ts", "adapters/browser.ts"]
  .map((path) =>
    stripTypeScriptTypes(
      readFileSync(`src/features/site-analytics/${path}`, "utf8")
        .replace(/^import .*?;\n/gm, "")
        .replace(/\bexport /g, ""),
    ),
  )
  .join("\n");

test("isolated analytics DOM: real exposure/pointer; no private/synthetic clicks; dispose", async ({
  page,
}) => {
  await page.setContent(
    '<section id="hero" style="height:500px"><h1>Public heading</h1><button id="public">Public</button><form><input id="private" value="PRIVATE_VALUE"></form><div data-analytics-private><button id="private-button">Private</button></div></section>',
  );
  await page.addScriptTag({
    content: `${source}
    window.analyticsResults=[];
    window.analyticsDispose=observePublicSections(window,"/",{
      exposure(section){window.analyticsResults.push({event:"exposure",section})},
      click(section,x,y){window.analyticsResults.push({event:"click",section,x,y})}
    });`,
  });
  const results = () => page.evaluate(() => Reflect.get(window, "analyticsResults") as unknown[]);
  await expect.poll(async () => (await results()).length).toBe(1);
  await page.locator("#public").click();
  await page.locator("#private").click();
  await page.locator("#private-button").click();
  await page.locator("#public").dispatchEvent("click", { button: 0, detail: 1, clientX: 50, clientY: 50 });
  await page.locator("#public").focus();
  await page.keyboard.press("Enter");
  expect(await results()).toEqual([
    { event: "exposure", section: "hero" },
    { event: "click", section: "hero", x: expect.any(Number), y: expect.any(Number) },
  ]);
  await page.evaluate(() => {
    const dispose: () => void = Reflect.get(window, "analyticsDispose");
    dispose();
  });
  await page.locator("#public").click();
  expect(await results()).toHaveLength(2);
});
