import assert from "node:assert/strict";
import { test } from "node:test";
import { consumerRights } from "../../content/es/legal/consumer-rights.ts";

test("every consumer-rights entry links an https authority page", () => {
  assert.ok(consumerRights.length > 0);
  for (const entry of consumerRights) {
    assert.match(entry.url, /^https:\/\//, `${entry.country}: authority url must be https`);
    assert.ok(entry.authority.length > 0, `${entry.country}: authority name`);
  }
});

test("every stated withdrawal period cites an https source", () => {
  for (const entry of consumerRights) {
    if (entry.period === null) continue;
    assert.ok(entry.source, `${entry.country}: a period needs a source`);
    assert.match(entry.source ?? "", /^https:\/\//, `${entry.country}: source must be https`);
  }
});

test("countries are unique and sorted alphabetically (Spanish collation)", () => {
  const names = consumerRights.map((entry) => entry.country);
  assert.equal(new Set(names).size, names.length, "duplicate country");
  const sorted = [...names].sort((a, b) => a.localeCompare(b, "es"));
  assert.deepEqual(names, sorted);
});
