import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { loadRatchets } from "../../tools/scorecard/ratchets.ts";
import { designFindings } from "../helpers/design-lint.ts";
import { LEGACY_EXCEPTIONS } from "../helpers/design-lint-exceptions.ts";
import { missingIssueReferences } from "../helpers/ignore-issues.ts";
import { sourceFiles } from "../helpers/source-architecture.ts";

const component = "src/views/home/fixture.tsx";
const fixtures: Record<string, string[]> = {
  coral: [
    '"bg-primary hover:text-primary/50 border-primary from-primary to-primary-hover"',
    '"shadow-coral bg-coral text-coral-hover"',
    '"bg-(--primary) text-(--pv-coral-hover)"',
    '"!bg-destructive ring-offset-primary decoration-coral outline-primary/50"',
    '"accent-primary caret-primary divide-primary border-t-primary hover:!text-destructive"',
    '"bg-[var(--primary)] text-[var(--pv-coral-hover)]"',
  ],
  "color-literal": [
    '"bg-[#fff]"',
    '"bg-[#ffff]"',
    '"border-[#abcd] text-[#beef]"',
    '"#11223344"',
    '"oklch(0.5 0.2 40)"',
    '"rgb(1,2,3)"',
    '"rgba(1,2,3,.5)"',
    '"hsl(0,0%,0%)"',
    '"lab(50% 40 59)"',
    '"lch(50% 40 59)"',
    '"oklab(0.5 0.1 0.1)"',
    '"hwb(12 0% 0%)"',
    '"color(display-p3 1 0 0)"',
    '"color-mix(in oklch, red, blue)"',
  ],
  "spacing-radius": [
    '"p-[13px]"',
    '"hover:rounded-[7px]"',
    '"gap-[12px]"',
    '"!p-[1rem]"',
    '"top-[0.5em] -left-[3px] w-[10rem] h-[2px] size-[20px] inset-x-[4px]"',
    '"scroll-mt-[5rem] min-w-[3rem] gap-x-[2px]"',
    '"[padding:13px] hover:[margin:-8px] [border-radius:7px]"',
  ],
  "transition-all": [
    '"hover:transition-all"',
    '"[transition:all_1s]"',
    '"[transition-property:all]"',
  ],
  "animated-property": [
    '"transition-[width]"',
    '"transition-colors"',
    '"transition"',
    '"[transition:width_1s]"',
    '"[-webkit-transition:height_1s]"',
  ],
};
test("inline styles: quoted keys and signed numbers are checked", () => {
  for (const source of [
    'const x = { style: { "padding": 8 } };',
    "const x = { style: { marginTop: -8 } };",
    'const x = { style: { "margin-top": "-8px" } };',
  ])
    assert.ok(
      designFindings(component, source).some((item) => item.rule === "spacing-radius"),
      source,
    );
  assert.deepEqual(
    designFindings(component, "const x = { style: { padding: 0, marginTop: -0 } };"),
    [],
  );
});

test("a bare four-letter fragment is not a colour", () => {
  assert.deepEqual(designFindings(component, 'const x = <a href="#cafe" />;'), []);
});

for (const [rule, sources] of Object.entries(fixtures))
  test(`${rule}: negative strings and templates`, () => {
    for (const source of sources) {
      assert.ok(
        designFindings(component, `const classes = ${source};`).some((item) => item.rule === rule),
        source,
      );
      assert.ok(
        designFindings(component, `const classes = \`${source.slice(1, -1)}\`;`).some(
          (item) => item.rule === rule,
        ),
        source,
      );
    }
  });

test("CSS, inline styles, @apply and literal fingerprints", () => {
  const css = (source: string) => designFindings("src/x.css", source).map((item) => item.rule);
  assert.ok(css(".a { color: var(--primary); }").includes("coral"));
  assert.ok(css(".a { color: var(--pv-coral-hover); }").includes("coral"));
  assert.ok(css(".a { background: var(--destructive); }").includes("coral"));
  assert.ok(css(".a { padding: 4px 1rem; }").includes("spacing-radius"));
  assert.ok(css(".a { border-radius: 0.5em; }").includes("spacing-radius"));
  assert.ok(css(".a { -webkit-transition: all 1s; }").includes("transition-all"));
  assert.ok(css(".a { @apply bg-primary p-[3px] transition-all; }").includes("coral"));
  assert.ok(css(".a { @apply p-[3px]; }").includes("spacing-radius"));
  assert.ok(css(".a { @apply transition-colors; }").includes("animated-property"));
  assert.ok(css(".a { @apply bg-[#fff]; }").includes("color-literal"));
  assert.deepEqual(css(".a { padding: var(--space-4); border-radius: 0; }"), []);
  const style = (source: string) =>
    designFindings(component, `const s = { style: ${source} };`).map((item) => item.rule);
  assert.ok(style("{ padding: 8 }").includes("spacing-radius"));
  assert.ok(style('{ borderRadius: "4px" }').includes("spacing-radius"));
  assert.ok(style('{ marginTop: "1rem" }').includes("spacing-radius"));
  assert.ok(style('{ transition: "all 1s" }').includes("transition-all"));
  assert.ok(style('{ transitionProperty: "height" }').includes("animated-property"));
  assert.deepEqual(style("{ padding: 0, opacity: 1 }"), []);
  const value = (source: string) => designFindings(component, source)[0]?.value;
  assert.equal(value('const a = "oklch(0.5 0.2 40)";'), "oklch(0.5 0.2 40)");
  assert.notEqual(value('const a = "oklch(0.1 0.2 40)";'), value('const a = "oklch(0.5 0.2 40)";'));
  for (const text of ['"#bebe"', '"/page#abc123def"', '"https://x.test/#fff-x"', '"id#fade"'])
    assert.deepEqual(designFindings(component, `const a = ${text};`), [], text);
});

test("allowed semantic utilities, price blocks, buttons and commerce pass", () => {
  assert.deepEqual(
    designFindings(
      component,
      'const classes = "bg-card p-4 rounded-lg transition-[transform,opacity]"; // bg-coral #fff',
    ),
    [],
  );
  for (const file of [
    "src/shared/ui/button-variants.ts",
    "src/features/commerce/presentation/checkout.tsx",
    "src/views/product/core/buy-box.tsx",
    "src/views/product/offer/offer-price.tsx",
  ])
    assert.deepEqual(designFindings(file, 'const classes = "text-coral bg-primary";'), []);
  for (const source of [
    ".x { transition: all 100ms; }",
    ".x { transition-property: all; }",
    ".x { transition: 100ms; }",
  ])
    assert.ok(
      designFindings("src/test.css", source).some((item) => item.rule === "transition-all"),
    );
  for (const source of [
    ".x { transition: width 100ms; }",
    ".x { transition-property: filter; }",
    "@keyframes x { from { height: 0; } to { height: 5px; } }",
  ])
    assert.ok(
      designFindings("src/test.css", source).some((item) => item.rule === "animated-property"),
    );
  assert.deepEqual(
    designFindings(
      "src/test.css",
      ".x { transition: transform 100ms, opacity 150ms; } @keyframes x { to { transform: none; opacity: 1; } }",
    ),
    [],
  );
  assert.ok(designFindings("src/test.css", ".x { color: #fff; }").length);
  assert.deepEqual(designFindings("src/app/globals.css", ".x { color: #fff; }"), []);
});

test("design findings match the frozen legacy exceptions; new findings and counts are ratcheted", () => {
  const findings = sourceFiles("src")
    .filter((file) => /\.(?:tsx?|css)$/.test(file))
    .flatMap((file) => designFindings(file, readFileSync(file, "utf8")));
  const ratchet = loadRatchets("ratchets").find((item) => item.metric === "design-lint");
  assert.ok(ratchet);
  const value = (key: string) => ratchet.values.find((item) => item.key === key);
  assert.deepEqual(
    ratchet.values.map((item) => item.key).sort(),
    [
      ...Object.keys(fixtures),
      ...Object.keys(fixtures).map((rule) => `legacy-exceptions:${rule}`),
    ].sort(),
  );
  for (const item of ratchet.values) assert.equal(item.direction, "max");
  for (const rule of Object.keys(fixtures)) {
    const legacy = LEGACY_EXCEPTIONS[rule];
    assert.ok(legacy?.reason.trim(), rule);
    if (!legacy) continue;
    const ofRule = findings.filter((item) => item.rule === rule);
    const values = (file: string) =>
      ofRule
        .filter((item) => item.file === file)
        .map((item) => item.value)
        .sort();
    for (const [file, expected] of Object.entries(legacy.files))
      assert.deepEqual(
        values(file),
        [...expected].sort(),
        `${rule}: ${file} (remove stale values)`,
      );
    const fresh = ofRule.filter((item) => !(item.file in legacy.files));
    assert.equal(fresh.length, value(rule)?.value, JSON.stringify(fresh));
    assert.equal(value(rule)?.value, 0, "baseline of new findings is empty");
    const frozen = Object.values(legacy.files).reduce((sum, list) => sum + list.length, 0);
    assert.equal(frozen, value(`legacy-exceptions:${rule}`)?.value, `${rule}: update the ratchet`);
  }
});

test("biome-ignore requires a trailing real issue reference after its reason", () => {
  for (const source of [
    "// biome-ignore lint/a: reason",
    "// biome-ignore lint/a: #42 reason",
    "// biome-ignore lint/a",
    "// biome-ignore-all lint/a: reason",
    "// biome-ignore-start lint/a: reason",
  ])
    assert.equal(missingIssueReferences("fixture.ts", source).length, 1);
  for (const issue of ["#42", "https://github.com/owner/repo/issues/42"])
    for (const [file, source] of [
      ["fixture.ts", `// biome-ignore lint/a: reason ${issue}`],
      ["fixture.css", `/* biome-ignore lint/a: reason ${issue} */`],
      ["fixture.json", `/* biome-ignore lint/a: reason ${issue} */ {}`],
    ])
      assert.deepEqual(missingIssueReferences(file ?? "", source ?? ""), []);
  assert.deepEqual(missingIssueReferences("fixture.ts", "// biome-ignore-all lint/a: r #1"), []);
  assert.deepEqual(missingIssueReferences("fixture.ts", "// biome-ignore-end lint/a"), []);
  assert.deepEqual(
    missingIssueReferences("fixture.ts", 'const text = "biome-ignore lint/a: missing";'),
    [],
  );
  const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0");
  const missing = files
    .filter((name) => /\.(?:[cm]?[tj]sx?|css|json)$/.test(name) && existsSync(name))
    .flatMap((file) => missingIssueReferences(file, readFileSync(file, "utf8")));
  assert.deepEqual(missing, [], "every biome-ignore needs an issue reference");
});
