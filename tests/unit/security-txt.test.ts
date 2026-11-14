import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const text = readFileSync("public/.well-known/security.txt", "utf8");
const dayMs = 24 * 60 * 60 * 1000;

test("security.txt (RFC 9116) has a contact and the canonical URL", () => {
  assert.match(text, /^Contact: (mailto:|https:\/\/)\S+$/m);
  assert.match(text, /^Canonical: https:\/\/pequeverso\.com\/\.well-known\/security\.txt$/m);
});

test("security.txt expires in the future, within 366 days", () => {
  const match = /^Expires: (\S+)$/m.exec(text);
  assert.ok(match?.[1], "Expires line is missing");
  const expires = Date.parse(match[1]);
  assert.ok(Number.isFinite(expires), "Expires is not an ISO 8601 date");
  assert.ok(expires > Date.now(), "security.txt has expired; renew it");
  assert.ok(expires - Date.now() <= 366 * dayMs, "Expires is more than 366 days away");
});
