import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

/** Headings of the ecosystem README template, in order (docs/master-plan/readme-template.md). */
const TEMPLATE_HEADINGS = [
  "Why",
  "Highlights",
  "Architecture",
  "Quickstart",
  "Usage",
  "Quality",
  "Documentation",
  "Ecosystem",
  "Contributing and security",
  "Scope and limits",
  "License",
];

/** `## ` headings outside fenced code blocks. */
function h2Headings(markdown: string): string[] {
  const headings: string[] = [];
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    else if (!fenced && line.startsWith("## ")) headings.push(line.slice(3).trim());
  }
  return headings;
}

test("README headings equal the ecosystem template, in order", () => {
  assert.deepEqual(h2Headings(read("README.md")), TEMPLATE_HEADINGS);
});

test("the template file still lists the same headings", () => {
  const template = read("docs/master-plan/readme-template.md");
  const listed = template
    .split("\n")
    .filter((line) => line.startsWith("## ") && !line.includes("<!--"));
  const names = listed.map((line) => line.slice(3).trim());
  for (const heading of TEMPLATE_HEADINGS.filter((h) => h !== "Usage")) {
    assert.ok(names.includes(heading), `template lacks ${heading}`);
  }
});

test("README has at most three badges and 80-180 lines", () => {
  const readme = read("README.md");
  const badges =
    readme.match(
      /<img[^>]+(?:badge|shields\.io)[^>]*>|!\[[^\]]*\]\([^)]*(?:badge|shields\.io)[^)]*\)/g,
    ) ?? [];
  assert.ok(badges.length <= 3, `${badges.length} badges`);
  const lines = readme.trimEnd().split("\n").length;
  assert.ok(lines >= 80 && lines <= 180, `${lines} lines`);
});

test("README has no TODO and every image has an alt attribute", () => {
  const readme = read("README.md");
  assert.doesNotMatch(readme, /\bTODO\b/);
  for (const tag of readme.match(/<img\b[^>]*>/g) ?? []) assert.match(tag, /\balt=/, tag);
});
