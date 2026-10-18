import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("Dependabot assessment cannot acquire a write token or perform a merge", () => {
  const workflow = readFileSync(".github/workflows/dependency-policy.yml", "utf8");
  assert.doesNotMatch(workflow, /(?:^|[\s{,])["']?[\w-]+["']?\s*:\s*["']?write(?:-all)?["']?(?=$|[\s,}])/m);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge|enablePullRequestAutoMerge/);
  assert.match(workflow, /pull-requests: read/);
});
