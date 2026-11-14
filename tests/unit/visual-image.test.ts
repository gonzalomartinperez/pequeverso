import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/** Visual baselines are only comparable inside the Playwright image of the installed version. */
test("the nightly visual job and the docs use the Playwright image of the installed version", () => {
  const version = (
    JSON.parse(readFileSync("node_modules/@playwright/test/package.json", "utf8")) as {
      version: string;
    }
  ).version;
  const image = `mcr.microsoft.com/playwright:v${version}-noble`;
  for (const file of [".github/workflows/nightly.yml", "docs/development.md"])
    assert.ok(readFileSync(file, "utf8").includes(image), `${file} must pin ${image}`);
});
