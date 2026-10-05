import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAssistantEnv } from "../../../src/features/assistant/flag.ts";

describe("assistant flag (disabled by default)", () => {
  it("is disabled when unset, empty or false, whatever the origin says", () => {
    for (const enabled of [undefined, "", "  ", "false"])
      assert.deepEqual(parseAssistantEnv({ enabled, apiOrigin: "https://api.example" }), {
        ok: true,
        flag: { enabled: false },
      });
  });

  it("fails closed on ambiguous values without echoing them", () => {
    for (const enabled of ["1", "TRUE", "yes", "on", "true ", "falsy", "secret-value"]) {
      const result = parseAssistantEnv({ enabled, apiOrigin: "https://api.example" });
      if (enabled === "true ") {
        assert.equal(result.ok, true); // surrounding whitespace is trimmed like every other variable
        continue;
      }
      assert.equal(result.ok, false, enabled);
      if (!result.ok) assert.ok(result.errors.every((error) => !error.includes(enabled)));
    }
  });

  it("requires a bare https origin when enabled", () => {
    assert.deepEqual(parseAssistantEnv({ enabled: "true", apiOrigin: "https://assistant.example/" }), {
      ok: true,
      flag: { enabled: true, apiOrigin: "https://assistant.example", localTest: false },
    });
    for (const apiOrigin of [
      undefined,
      "",
      "assistant.example",
      "http://assistant.example",
      "https://assistant.example/api",
      "https://assistant.example?x=1",
      "https://user:pass@assistant.example",
      "javascript:alert(1)",
      "http://localhost:8000",
      "https://localhost:8000",
    ])
      assert.equal(parseAssistantEnv({ enabled: "true", apiOrigin }).ok, false, String(apiOrigin));
  });

  it("allows loopback origins only for explicit local test builds", () => {
    assert.equal(
      parseAssistantEnv({ enabled: "true", apiOrigin: "https://127.0.0.1:8217", localTestBuild: "true" }).ok,
      true,
    );
    const result = parseAssistantEnv({
      enabled: "true",
      apiOrigin: "http://127.0.0.1:8217",
      localTestBuild: "true",
    });
    assert.deepEqual(result, {
      ok: true,
      flag: { enabled: true, apiOrigin: "http://127.0.0.1:8217", localTest: true },
    });
    assert.equal(
      parseAssistantEnv({ enabled: "true", apiOrigin: "http://example.com", localTestBuild: "true" }).ok,
      false,
    );
  });
});
