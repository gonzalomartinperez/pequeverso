import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { describe, it } from "node:test";

/** config/next.ts must always define the switch so the bundler can fold it (see slot.tsx). */
function configEnv(env: Record<string, string>): unknown {
  const script =
    'const m=await import("./config/next.ts");const c=await m.default;' +
    'const v=typeof c==="function"?await c("phase-production-build",{defaultConfig:{}}):c;' +
    "process.stdout.write(JSON.stringify(v.env))";
  const out = execFileSync("node", ["--input-type=module", "-e", script], {
    env: { NODE_ENV: "production", PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out.toString("utf8"));
}

describe("next config defines the assistant switch", () => {
  it("normalizes an absent, empty or false value to false", () => {
    for (const env of [
      {},
      { NEXT_PUBLIC_ASSISTANT_ENABLED: "" },
      { NEXT_PUBLIC_ASSISTANT_ENABLED: " false " },
    ])
      assert.deepEqual(configEnv(env), {
        NEXT_PUBLIC_ASSISTANT_ENABLED: "false",
        NEXT_PUBLIC_ASSISTANT_API_ORIGIN: "",
      });
  });

  it("normalizes an enabled value and its origin", () => {
    assert.deepEqual(
      configEnv({
        NEXT_PUBLIC_ASSISTANT_ENABLED: " true ",
        NEXT_PUBLIC_ASSISTANT_API_ORIGIN: "https://api.example/",
      }),
      { NEXT_PUBLIC_ASSISTANT_ENABLED: "true", NEXT_PUBLIC_ASSISTANT_API_ORIGIN: "https://api.example" },
    );
  });

  it("refuses an ambiguous value", () => {
    assert.throws(() => configEnv({ NEXT_PUBLIC_ASSISTANT_ENABLED: "yes" }));
  });
});
