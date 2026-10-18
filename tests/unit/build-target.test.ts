import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOutput, isHostingerNodeBuilder } from "../../tools/lib/build-target.ts";

test("Hostinger's Node builder (cwd under /hbuilds/) is standalone even without NEXT_OUTPUT", () => {
  const hostinger = "/home/u1/domains/pequeverso.com/hbuilds/source/repository";
  assert.ok(isHostingerNodeBuilder(hostinger));
  assert.equal(buildOutput({}, hostinger), "standalone");
  assert.equal(buildOutput({ NEXT_OUTPUT: "export" }, hostinger), "standalone");
});

test("local and CI builds follow NEXT_OUTPUT (export by default)", () => {
  assert.equal(buildOutput({}, "/home/dev/pequeverso"), "export");
  assert.equal(buildOutput({ NEXT_OUTPUT: "standalone" }, "/home/dev/pequeverso"), "standalone");
  assert.ok(!isHostingerNodeBuilder("C:\\work\\pequeverso"));
});
