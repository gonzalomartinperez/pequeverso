import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const decisions = new URL("../../docs/decisions/", import.meta.url);
const root = new URL("../../", import.meta.url);
const adrFiles = readdirSync(decisions)
  .filter((name) => /^ADR-\d{4}-.+\.md$/.test(name))
  .sort();
const index = readFileSync(new URL("README.md", decisions), "utf8");

/** Table rows of the index: file name -> { title, status }. */
const rows = new Map<string, { title: string; status: string }>();
for (const match of index.matchAll(/^\| \[ADR-\d{4}\]\(([^)]+)\) \| (.+?) \| (.+?) \|$/gm)) {
  rows.set(match[1] ?? "", { title: match[2] ?? "", status: match[3] ?? "" });
}

const adr = (name: string) => readFileSync(new URL(name, decisions), "utf8");
const titleOf = (text: string) => /^# ADR-\d{4}: (.+)$/m.exec(text)?.[1]?.trim() ?? "";
const statusOf = (text: string) => /Status:\s*([a-z]+)/i.exec(text)?.[1]?.toLowerCase() ?? "";

test("the index lists every ADR exactly once and nothing else", () => {
  assert.deepEqual([...rows.keys()].sort(), adrFiles);
});

for (const name of adrFiles) {
  test(`${name}: index title and status match`, () => {
    const text = adr(name);
    const row = rows.get(name);
    assert.ok(row, "missing from the index");
    // Titles may be shortened with a plain-text colon; compare after normalising separators.
    const norm = (s: string) =>
      s
        .replace(/[:—–-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    assert.equal(norm(row.title), norm(titleOf(text)));
    assert.equal(row.status.split(" ")[0], statusOf(text));
  });
}

const REPO_ROOTS = [
  "src",
  "config",
  "tools",
  "tests",
  "docs",
  "scripts",
  "contracts",
  "content",
  "media",
  "public",
  ".github",
  "server",
];

/** Backticked repository paths cited by an ADR that do not exist. */
function missingPaths(text: string): string[] {
  return [...text.matchAll(/`([^`\s]+)`/g)]
    .map((m) => m[1] ?? "")
    .filter((p) => REPO_ROOTS.includes(p.split("/")[0] ?? "") && p.includes("/"))
    .filter((p) => !/[*<>{}]/.test(p))
    .filter((p) => !existsSync(new URL(p, root)));
}

test("non-superseded ADRs cite existing paths, or carry a Path note", () => {
  for (const name of adrFiles) {
    const text = adr(name);
    if (statusOf(text) === "superseded" || text.includes("> Path note:")) continue;
    assert.deepEqual(missingPaths(text), [], `${name} cites missing paths`);
  }
});

test("a Path note appears only in ADRs that cite at least one missing path", () => {
  for (const name of adrFiles) {
    const text = adr(name);
    if (!text.includes("> Path note:")) continue;
    assert.ok(missingPaths(text).length > 0, `${name} has a Path note but no missing path`);
  }
});
