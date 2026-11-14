import assert from "node:assert/strict";
import { test } from "node:test";
import { inScope, mutateGlobs } from "../../tools/ci/mutation-scope.ts";

const globs = mutateGlobs();

test("the mutation scope lists only pure modules that exist, never UI glue", () => {
  assert.ok(globs.length > 0);
  for (const glob of globs) assert.doesNotMatch(glob, /presentation|components|\.tsx|app\//);
});

test("inScope keeps scoped sources and drops tests, UI and unrelated files", () => {
  const files = [
    "src/features/commerce/domain/checkout-url.ts",
    "tools/lib/edge-rules.ts",
    "src/features/assistant/domain/links.ts",
    "src/features/assistant/presentation/panel.tsx",
    "src/features/commerce/domain/checkout-url.test.ts",
    "src/shell/header.tsx",
    "docs/development.md",
  ];
  assert.deepEqual(inScope(files, globs), [
    "src/features/commerce/domain/checkout-url.ts",
    "tools/lib/edge-rules.ts",
    "src/features/assistant/domain/links.ts",
  ]);
  assert.deepEqual(inScope(["README.md"], globs), []);
});
