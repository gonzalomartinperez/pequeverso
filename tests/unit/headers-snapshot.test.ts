import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { loadEdgeRules, toNextHeaders } from "../../tools/lib/edge-rules.ts";

// edge-rules.test.ts already checks the complete Apache render against docs/generated/htaccess.txt.
// Empty environment keeps this golden independent of optional deployment integrations.
test("rendered Next headers match the reviewed exact snapshot", () => {
  const snapshot: unknown = JSON.parse(
    readFileSync(new URL("./fixtures/headers.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(toNextHeaders(loadEdgeRules(undefined, {})), snapshot);
});
