import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { mock } from "node:test";
import { pathToFileURL } from "node:url";

// The artifact identity and diff are declared fixture inputs; no host Git state is consulted.
const [file, ...args] = process.argv.slice(2);
assert.ok(file);
mock.method(childProcess, "execFileSync", (command: string, gitArgs: string[]) => {
  assert.equal(command, "git");
  assert.deepEqual(gitArgs, JSON.parse(process.env.FIXTURE_GIT_ARGS ?? "[]"));
  return process.env.FIXTURE_GIT_OUTPUT ?? "";
});
syncBuiltinESMExports();
process.argv = [process.execPath, file, ...args];
await import(pathToFileURL(file).href);
