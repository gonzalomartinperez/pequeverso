import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

// ADR-0007 and the M4 exit: every file we write is TypeScript. The one JavaScript file is the
// `next.config.mjs` re-export of config/next.ts (the name Hostinger's builder wraps).
const ALLOWED = ["next.config.mjs"];

test("the only tracked JavaScript file is the next.config.mjs re-export", () => {
  const tracked = execFileSync("git", ["ls-files", "-z", "--", "*.js", "*.mjs", "*.cjs", "*.jsx"], {
    encoding: "utf8",
    timeout: 10_000,
  })
    .split("\0")
    .filter(Boolean)
    .sort();
  assert.deepEqual(tracked, ALLOWED);
});
